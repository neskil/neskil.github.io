// THE ROLL-TOP SEA ("roll-top-harbour"): an ideal Renaissance harbour city cut wholly from veneer. Marquetry and
// intarsia: nine woods and nothing else, tone = species x grain direction x where you stand (chatoyance), a line is
// a glue-filled saw kerf, a shadow is a darker wood let in to the right of things, distance is larger, plainer,
// paler pieces. No lights, no fog, no full-screen pass. The sea is the hero part (src/parts/roll-top-harbour.js):
// a tambour that climbs its runners at the horizon and rolls over like the lid of a desk.
// FRAME  +Z is the course, +X is port (left), sea level y 0, pavement y 1. Study z 0-30 (six times life), street
//   z 30-200, piazza z 200-260, quay edge z 260 (= the hero's course-frame origin), ring on the bastion at z 545.
//   The sea runs 560 m flat from the quay (the brief's 700 was cut by a fifth so that from the staves the wall fills
//   the frame to its lip and the runners stand at the frame's edges), then up its 260 m curve.
// VARIES BY SEED  hour (morning / golden / night cut), weather (calm / breeze / blow), cabinet (Italian / northern
//   pale / dark rosewood), cast (caravels / galleys / one carrack; swallows / pigeons; armillary / faceted ring /
//   astrolabe; finch / squirrel). RARE  the lid comes down: the tambour reverses and the sea is closed over the harbour.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, createStyle, STYLE_GLSL, SPECIES, SEA, seaCurveJS, swellJS } from '../parts/roll-top-harbour.js';

const S = SPECIES;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, t) => { t = clamp01((t - a) / (b - a)); return t * t * (3 - 2 * t); };
const PAVE = 1, QUAY_Z = 260, RING_Z = 545, DURATION = 39.5, FLEET_RUN = SEA.flat - 130;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------- the sky is a board
// One upright panel of ripple maple, book-matched about the course plane (x = 0): figure(left) = figure(right)
// mirrored, the seam a kerf dead ahead. Four routed slots; ten burr cut-out clouds slide in them left to right.
// The sun is a holly disc in a pear ring. Night cut: burr walnut, holly stars, a holly moon.
const SKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main(){
    vDir = position;
    vec4 p = projectionMatrix*viewMatrix*vec4(position*900. + cameraPosition, 1.);
    if (abs(p.w) < 1e-4) p.w = 1e-4;
    gl_Position = p.xyww;
  }`;
const skyFrag = (tone) => /* glsl */`
  ${STYLE_GLSL}
  ${tone}
  uniform vec4 uCloud[10];      // az0 (rad), slot elevation (tan), size (rad), seed
  uniform vec3 uSky;           // species of the board, species of the clouds, night 0/1
  uniform vec3 uSunDir; uniform float uDrift; uniform vec3 uCamS;
  varying vec3 vDir;
  float h21(vec2 p){ p = fract(p*vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
  void main(){
    vec3 d = vDir/max(length(vDir), 1e-4);
    float hz = max(length(d.xz), 1e-4);
    float az = atan(d.x, d.z + (abs(d.x) + abs(d.z) < 1e-5 ? 1e-5 : 0.));       // 0 dead ahead, + to port
    float el = clamp(d.y/hz, -4., 4.);
    float maz = abs(az);                                                         // book-match about the seam
    vec2 bd = vec2(maz, el)*620.;                                                // board metres
    float px = max(length(fwidth(vec2(az, el))), 1e-6);                          // radians per pixel
    float fid; vec3 c = woodColor(uSky.x, vec2(bd.y*.5, bd.x*.5), .37, fid);
    // fiddleback: fine level bands that shimmer as we move (the board's sheen depends on where we stand)
    float band = sin(bd.y*.42 + 1.6*fid + 1.2*sin(bd.x*.011) + uCamS.z*.06 + uCamS.x*.04);
    float figure = .5 + .5*sin(bd.x*.016 + 3.*fid + bd.y*.004);
    vec3 H = uSun - d; H /= max(length(H), 1e-4);
    vec3 T = vec3(.2*band + .2*(figure - .5), 1., 0.); T /= max(length(T), 1e-4);
    float th = dot(T, H), s = clamp(1. - th*th, 0., 1.); s = s*s*s; s *= s;
    // (the board's sheen is held under the shoulder of the tone curve, about .78 at its palest: above it the pale
    // woods flatten and the ripple below could not be seen at all)
    vec3 wb = woodBase(uSky.x); float cap = min(1.3, .78/max(max(wb.r, wb.g), max(wb.b, 1e-3)));
    c *= mix(.72*cap, cap, s)*(1. + .035*band);
    // the ripple of the maple, broad enough to read across the harbour: level bands a step lighter and darker
    // (1.15 apart), firm-edged, leaning a little toward the seam so the two leaves meet in a chevron, their width
    // and wander taken from the slow figure of the sheet (the same on both leaves, mirrored)
    vec4 fg = texture2D(uGrain, vec2(maz*.55, el*.9) + vec2(.21, .63));
    float rw = el*52. + maz*9. + 5.*(fg.b - .5) + 2.2*sin(maz*4.3 + el*3.) + (uCamS.z*.0016 + uCamS.x*.004);
    float rpx = max(fwidth(rw), 1e-4), rip = clamp(sin(rw)/min(rpx, 1.) , -1., 1.)*(1. - smoothstep(1.2, 3.2, rpx));
    float curl = clamp((fg.r - .5)/max(fwidth(fg.r)*1.5, .02), -1., 1.);
    c *= (1. + .105*rip)*(1. + .04*curl);
    // holly stars and nothing else on the night board
    if (uSky.z > .5){
      vec2 sg = vec2(maz, el)*26.; vec2 si = floor(sg), sf = fract(sg) - .5;
      float r = h21(si), rad = max(.06 + .07*h21(si + 7.), 1.6*px*26.);
      vec2 so = (vec2(h21(si + 3.), h21(si + 5.)) - .5)*.6;
      float star = step(.72, r)*(1. - smoothstep(rad - px*26., rad + px*26., abs(sf.x - so.x) + abs(sf.y - so.y)));
      c = mix(c, uWood[0]*1.05, star*step(.02, el));
    }
    // the four routed slots
    float kw = max(.0009, .8*px), slot = 0.;
    for (int i = 0; i < 4; i++){ float e = .16 + float(i)*.142; slot = max(slot, 1. - smoothstep(kw - .5*px, kw + .5*px, abs(el - e))); }
    c = mix(c, glue(), slot*.85);
    // clouds: flat cut-outs (three lobes on a straight base) sliding in the slots
    float cd = 1e3; vec3 cq = vec3(0.);
    for (int i = 0; i < 10; i++){
      vec4 C = uCloud[i];
      float a = mod(C.x + uDrift*(.8 + .4*fract(C.y*13.7)) + 1.35, 2.7) - 1.35;      // the clouds keep within 1.35 rad of the seam (the frame's half width is .82)
      vec2 q = vec2(az - a, el - C.y)/max(C.z, 1e-4);
      float l1 = length(q - vec2(0., .16)) - .42, l2 = length(q - vec2(-.5, .08)) - .3, l3 = length(q - vec2(.48, .1)) - .33, l4 = length((q - vec2(.05, .02))*vec2(.55, 1.6)) - .5;
      float dd = max(min(min(l1, l2), min(l3, l4)), -.07 - q.y)*C.z;
      if (dd < cd){ cd = dd; cq = vec3(q, C.w); }
    }
    {
      float fd2; vec2 cu = vec2(abs(az)*sign(cq.x + 1e-4), el)*620.;
      vec3 cc = woodColor(uSky.y, vec2(cu.x*.6 + cq.z*31., cu.y*.6), fract(cq.z), fd2);
      float eye = texture2D(uGrain, vec2(maz, el)*5.5 + cq.z).a;
      cc = mix(cc, uWood[4]*1.1, smoothstep(.55, .8, eye)*.8);                   // brown eyes of the burr
      cc *= mix(.9, 1.35, s);
      float inside = 1. - smoothstep(-.5*px, .5*px, cd);
      c = mix(c, cc, inside);
      c = mix(c, glue(), (1. - smoothstep(kw - .5*px, kw + .5*px, abs(cd)))*.9);
    }
    // the sun: a plain disc of holly in a ring of pear (it does not glow); at night a holly moon
    float sa = acos(clamp(dot(d, uSunDir), -1., 1.));
    float disc = 1. - smoothstep(.058 - .5*px, .058 + .5*px, sa), ring = 1. - smoothstep(.082 - .5*px, .082 + .5*px, sa);
    vec3 sunc = mix(uWood[3]*1.15, uWood[0]*1.06, disc);
    c = mix(c, sunc, ring);
    c = mix(c, glue(), max(1. - smoothstep(kw - .5*px, kw + .5*px, abs(sa - .058)), 1. - smoothstep(kw - .5*px, kw + .5*px, abs(sa - .082))));
    // the book-match seam
    float seam = (1. - smoothstep(kw - .5*px, kw + .5*px, abs(az)*hz))*step(0., d.z);
    c = mix(c, glue(), seam);
    gl_FragColor = vec4(toScene(c), 1.);
  }`;
function buildSky(style, rng, look) {
  const clouds = [];
  // ten clouds: four in the top slot (over the lip of the sea, 0.675 rad apart, so one is always near the seam and
  // turns into its own mirror as it crosses), three in the next, two and one below (seen either side of the roll)
  const start = rng.range(0, 0.9);
  for (let i = 0; i < 9; i++) { const slot = i < 3 ? 3 : i < 6 ? 2 : i < 8 ? 1 : 0, k = i < 3 ? i : i < 6 ? i - 3 : i < 8 ? i - 6 : 0, n = slot === 3 ? 4 : slot === 2 ? 3 : slot === 1 ? 2 : 1, e = 0.16 + slot * 0.142;
    clouds.push(new THREE.Vector4(start + slot * 0.37 + (k + rng.range(-0.12, 0.12)) * (2.7 / n), e, slot === 3 ? rng.range(0.085, 0.105) : rng.range(0.1, 0.15), rng.range(0.1, 0.9))); }
  // a fourth in the top slot: they pass 0.675 rad apart, and the window over the lip of the hood is 0.66 wide, so one is always near the seam
  clouds.push(new THREE.Vector4(start + 1.11 + (3 + (clouds[4].w - 0.5) * 0.24) * 0.675, 0.16 + 3 * 0.142, 0.085 + 0.02 * clouds[5].w, (clouds[3].w * 7.3 + 0.31) % 1));
  const U = { ...style.uniforms, uCloud: { value: clouds }, uSky: { value: new THREE.Vector3(look.skySp, look.cloudSp, look.night ? 1 : 0) }, uSunDir: { value: look.sun.clone() }, uDrift: { value: 0 }, uCamS: { value: new THREE.Vector3() } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SKY_VERT, fragmentShader: skyFrag(style.tone), side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), mat); mesh.frustumCulled = false; mesh.renderOrder = -10;
  return { mesh, U };
}

// ---------------------------------------------------------------- things on hinges: one instanced leaf of veneer
// A leaf is a flat piece hinged on its local Y axis at x = 0 (instance scale = width, height, width). Shutters,
// cupboard lattice doors, swallows and gulls (two book-matched leaves on one spine), pigeons, vine leaves, fruit,
// oars. aLeaf = species, rnd, grain angle, shape; aHinge = base angle, swing, rate, phase; aKey = world z at which
// it opens as the camera comes (0 = never), opening angle, field species, spare.
const LEAF_VERT = /* glsl */`
  attribute vec4 aLeaf; attribute vec4 aHinge; attribute vec4 aKey;
  uniform float uTime; uniform float uCamZ;
  varying vec3 vW; varying vec3 vT; varying vec3 vN; varying vec2 vUv; varying vec2 vBox; varying vec4 vLeaf; varying float vSp2;
  void main(){
    float w = length(instanceMatrix[0].xyz), h = length(instanceMatrix[1].xyz);
    float open = aKey.x > .5 ? smoothstep(aKey.x - 75., aKey.x - 22., uCamZ) : 0.;
    open += .06*sin(open*9.4)*(1. - open);
    float a = aHinge.x + aHinge.y*sin(aHinge.z*uTime + aHinge.w) + aKey.y*open;
    float ca = cos(a), sa = sin(a);
    vec3 lp = vec3(position.x*ca, position.y, -position.x*sa);
    vec3 lt = vec3(cos(aLeaf.z)*ca, sin(aLeaf.z), -cos(aLeaf.z)*sa), ln = vec3(sa, 0., ca);
    mat3 im = mat3(instanceMatrix), mm = mat3(modelMatrix);
    vec4 wp = modelMatrix*(instanceMatrix*vec4(lp, 1.));
    vW = wp.xyz; vT = mm*(mat3(im[0]/max(w, 1e-4), im[1]/max(h, 1e-4), im[2]/max(w, 1e-4))*lt); vN = mm*(mat3(im[0]/max(w, 1e-4), im[1]/max(h, 1e-4), im[2]/max(w, 1e-4))*ln);
    vUv = vec2((position.x - .5)*w, position.y*h); vBox = vec2(w, h)*.5; vLeaf = aLeaf; vSp2 = aKey.z;
    gl_Position = projectionMatrix*viewMatrix*wp;
  }`;
const leafFrag = (tone) => /* glsl */`
  ${STYLE_GLSL}
  ${tone}
  uniform float uKerf; uniform float uKerfFar;
  varying vec3 vW; varying vec3 vT; varying vec3 vN; varying vec2 vUv; varying vec2 vBox; varying vec4 vLeaf; varying float vSp2;
  void main(){
    vec3 T = vT/max(length(vT), 1e-4), N = vN/max(length(vN), 1e-4);
    vec3 B = cross(N, T); B /= max(length(B), 1e-4);
    vec3 Vv = cameraPosition - vW; float dist = length(Vv); Vv /= max(dist, 1e-4);
    float px = max(max(fwidth(vUv.x), fwidth(vUv.y)), 1e-6);
    vec2 q = vUv/max(vBox, vec2(1e-4));                       // -1..1
    float shape = vLeaf.w, sp = vLeaf.x, ga = vLeaf.z;
    vec2 e = vBox - abs(vUv); float d = min(e.x, e.y);        // metres to the piece edge
    float turn = 0.; bool cut = false;                        // cut: outside the piece's outline (decided in its branch, sawn off below)
    if (shape < .5){                                          // a framed door: rails of one wood, a field of another
      float fw = .16*min(vBox.x, vBox.y) + .03;
      float inField = step(fw, d);
      d = min(abs(d - fw), d); sp = mix(sp, vSp2, inField); turn = inField*1.5708;
    } else if (shape < 1.5){                                  // a lattice door: real slats, real holes
      float fw = .14*min(vBox.x, vBox.y) + .05, per = max(.34*min(vBox.x, vBox.y), .2);
      if (e.x > fw && e.y > fw){
        float a1 = abs(fract((vUv.x + vUv.y)/per) - .5)*per, a2 = abs(fract((vUv.x - vUv.y)/per) - .5)*per, sw = per*.19;
        float fine = smoothstep(2.5, 4.5, per/px);            // far away the lattice is its flat average
        if (fine > .5){ if (min(a1, a2) > sw) cut = true; d = min(sw - min(a1, a2), min(e.x, e.y) - fw + sw); turn = a1 < a2 ? .785 : -.785; sp = a1 < a2 ? sp : vSp2; }
        else { sp = 4.; d = 1.; }
      } else d = min(d, abs(min(e.x, e.y) - fw));
    } else if (shape < 2.5){                                  // half a bird, cut from one leaf: half the body along the spine,
      float x = q.x*.5 + .5, y = q.y, fat = (shape - 2.)*2.5; // a swept wing, one streamer of the forked tail (fat: pigeons, cut as they were)
      float sf = clamp(1. - fat, 0., 1.);                     // swallows and gulls: a head, a blunter wing tip, less sweep, a shorter fork (a bird, not a shard)
      float mb = (.13 + .09*fat + .03*sf)*(1. - smoothstep(.5 - .22*sf, .97 - .3*sf, y))*(.3 + .7*smoothstep(-.8, -.3, y))*step(-.82 - .2*fat, y) - x;
      float hx = x*vBox.x*2., hy = (y - .62)*vBox.y, hr = .13*vBox.x*2.;
      float mh = sf > .05 ? max((1. - sqrt(hx*hx + hy*hy)/max(hr, 1e-4))*.1, min(.045*(.99 - y)/.14 - x, y - .76)) : -1.;
      float yc = .44 - .1*sf - (.95 - .35*fat - .25*sf)*pow(max(x, 1e-4), 1.35), mw = min((.3 + .24*fat)*(1. - x) + .025 + .055*sf - abs(y - yc), (.985 - x)*2.);
      float mt = (y < -.4 && y > -.985 + .2*sf) ? .05 + .07*fat + .012*sf - abs(x - (.05 + .05*fat - (y + .4)*.3)) : -1.;
      float m = max(max(mb, mh), max(mw, mt)); if (m < 0.) cut = true;
      d = min(m*min(vBox.x*2., vBox.y), mw > 0. ? abs(x - .6)*vBox.x*2. : 1.); if (x > .6) sp = vSp2;
    } else if (shape < 3.5){                                  // a lozenge (leaves, cypress scales)
      float m = 1. - abs(q.x) - abs(q.y); if (m < 0.) cut = true; d = m*min(vBox.x, vBox.y)*.7;
    } else {                                                  // a round (fruit, bosses)
      float m = 1. - length(q); if (m < 0.) cut = true; d = m*min(vBox.x, vBox.y);
    }
    float ct = cos(turn), st = sin(turn);
    vec3 Tt = T*ct + B*st, Bt = B*ct - T*st;
    vec2 g = vec2(vUv.x*cos(ga + turn) + vUv.y*sin(ga + turn), vUv.y*cos(ga + turn) - vUv.x*sin(ga + turn));
    float fid; vec3 c = woodColor(sp, g, vLeaf.y, fid);
    // the outline is sawn only here: woodColor reads the grain sheet at a level taken from the pixel's neighbours,
    // so a pixel outside the cut must still be there when the pixel beside it reads (nothing below needs a neighbour)
    if (cut) discard;
    c *= sheenGain(sheenTerm(Tt, Bt, Vv, (fid - .5)*.5));
    float small = min(vBox.x, vBox.y)/px;
    float fade = (1. - smoothstep(uKerfFar*.7, uKerfFar, dist))*smoothstep(1.5, 3., small);
    c = mix(c, glue(), kerfMask(d, px, uKerf, fade));
    gl_FragColor = vec4(toScene(c), 1.);
  }`;
class LeafSet {
  constructor() { this.M = []; this.L = []; this.H = []; this.K = []; this.n = 0; this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._b = new THREE.Matrix4(); }
  // origin = hinge point; xDir = the way the leaf lies at angle 0; yDir = hinge axis; o = { sp, rnd, ga, shape, base, amp, rate, phase, keyZ, openAng, sp2, mirror }
  add(origin, xDir, yDir, w, h, o = {}) {
    const x = xDir.clone().normalize(), y = yDir.clone().normalize(), z = new THREE.Vector3().crossVectors(x, y).normalize();
    y.crossVectors(z, x).normalize();
    this._b.makeBasis(x.multiplyScalar(w * (o.mirror ? -1 : 1)), y.multiplyScalar(h), z.multiplyScalar(w)); this._b.setPosition(origin);
    this._b.toArray(this.M, this.n * 16);
    this.L.push(o.sp ?? 4, o.rnd ?? ((this.n * 0.6180339) % 1), o.ga ?? 0, o.shape ?? 0);
    this.H.push(o.base ?? 0, o.amp ?? 0, o.rate ?? 1, o.phase ?? 0);
    this.K.push(o.keyZ ?? 0, o.openAng ?? 0, o.sp2 ?? (o.sp ?? 4), 0);
    return this.n++;
  }
  build(mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, -0.5, 0, 1, -0.5, 0, 1, 0.5, 0, 0, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('aLeaf', new THREE.InstancedBufferAttribute(new Float32Array(this.L), 4));
    g.setAttribute('aHinge', new THREE.InstancedBufferAttribute(new Float32Array(this.H), 4));
    g.setAttribute('aKey', new THREE.InstancedBufferAttribute(new Float32Array(this.K), 4));
    const mesh = new THREE.InstancedMesh(g, mat, Math.max(1, this.n));
    mesh.instanceMatrix.array.set(this.M); mesh.count = this.n; mesh.frustumCulled = false; mesh.instanceMatrix.needsUpdate = true;
    this.mesh = mesh; return mesh;
  }
  // live leaves (birds): frame given as origin + unit x, y, z axes and sizes
  set(i, p, x, y, z, w, h, mirror) {
    const e = this.mesh.instanceMatrix.array, o = i * 16, sx = mirror ? -w : w;
    e[o] = x.x * sx; e[o + 1] = x.y * sx; e[o + 2] = x.z * sx; e[o + 3] = 0; e[o + 4] = y.x * h; e[o + 5] = y.y * h; e[o + 6] = y.z * h; e[o + 7] = 0;
    e[o + 8] = z.x * w; e[o + 9] = z.y * w; e[o + 10] = z.z * w; e[o + 11] = 0; e[o + 12] = p.x; e[o + 13] = p.y; e[o + 14] = p.z; e[o + 15] = 1;
  }
}

// ---------------------------------------------------------------- the look of this visit
const FORCE = null;      // test hook: e.g. { hour: 'night' }; always null when shipped
function chooseLook(ctx) {
  const r = ctx.rng.fork('look'), vary = ctx.vary || {}, hv = vary.hour || 'any';
  const h = r(), we = r(), cb = r(), sh = r(), bd = r(), pl = r(), pt = r();
  const hour = hv === 'night' ? 'night' : hv === 'golden' ? 'golden' : hv === 'day' || hv === 'dawn' ? 'morning' : h < 0.5 ? 'morning' : h < 0.8 ? 'golden' : 'night';
  const rare = !!vary.rare;
  const look = {
    hour, rare,
    weather: we < 0.25 ? 'calm' : we < 0.75 ? 'breeze' : 'blow',
    cabinet: hour === 'night' ? 'italian' : cb < 0.5 ? 'italian' : cb < 0.76 ? 'northern' : 'dark',
    ships: sh < 0.5 ? 'caravels' : sh < 0.8 ? 'galleys' : 'carrack',
    birds: bd < 0.7 ? 'swallows' : 'pigeons',
    plinth: pl < 0.5 ? 'armillary' : pl < 0.75 ? 'ring' : 'astrolabe',
    pet: pt < 0.6 ? 'finch' : 'squirrel',
    density: Math.min(1.3, Math.max(0.7, vary.density ?? 1)), detail: Math.min(1, Math.max(0.6, ctx.quality?.detail ?? 1)),
  };
  if (FORCE) Object.assign(look, FORCE);
  look.night = look.hour === 'night'; look.golden = look.hour === 'golden'; if (look.night) look.cabinet = 'italian';
  // the fixed sun: 55 degrees left of the course and 38 up; golden hour: low on the right; night: the moon where the sun was
  const az = (look.golden ? -62 : 55) * DEG, el = (look.golden ? 15 : 38) * DEG;
  look.sun = V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  look.side = look.golden ? -1 : 1;                 // which side the sun is on (+1 port); inlaid shadows fall to the other
  look.shLen = look.golden ? 3 : 1;                 // golden-hour shadows are three times as long
  look.skySp = look.night ? S.walnut : look.cabinet === 'dark' ? S.oak : S.sycamore;
  look.cloudSp = look.night ? S.bogoak : look.cabinet === 'dark' ? S.sycamore : S.holly;
  look.swell = look.weather === 'calm' ? 0.42 : look.weather === 'blow' ? 1.8 : 0.9;
  look.title = 'The Roll-Top Sea' + (look.rare ? ': the Lid Comes Down' : look.night ? ': Night Cut' : look.golden ? ': Golden Hour' : look.weather === 'blow' ? ': a Blow' : '');
  return look;
}
// the cabinet and the hour re-choose the nine woods (display-linear colours in style.woods, mutated in place)
function applyCabinet(style, look) {
  const w = style.woods, hex = (h) => new THREE.Color(h), mixTo = (i, h, k) => w[i].lerp(hex(h), k);
  if (look.cabinet === 'northern') {               // holly, sycamore and harewood, ebony lines only
    mixTo(S.oak, '#E0CFA6', 0.55); mixTo(S.pear, '#B7B49A', 0.6); mixTo(S.walnut, '#7F8272', 0.62); mixTo(S.rosewood, '#59564B', 0.7); mixTo(S.bogoak, '#3B3A33', 0.5);
  } else if (look.cabinet === 'dark') {            // rosewood and ebony with holly figures
    mixTo(S.sycamore, '#C89A56', 0.55); mixTo(S.oak, '#9A5A38', 0.6); mixTo(S.pear, '#6B3026', 0.6); mixTo(S.walnut, '#40241B', 0.6); mixTo(S.harewood, '#6F7667', 0.5);
  }
  for (let i = 0; i < 10; i++) if (i !== S.ebony) w[i].multiplyScalar(1.12);      // the usual sheen is about 0.85: this lands the named woods on their hex
  if (look.golden) {                               // warmer woods, more pear and oak
    mixTo(S.sycamore, '#DDB878', 0.5); mixTo(S.holly, '#F2DDB4', 0.45); mixTo(S.harewood, '#A39A78', 0.45); mixTo(S.oak, '#C98A4A', 0.4); mixTo(S.walnut, '#74401F', 0.3);
  }
  if (look.night) {                                // an ebony ground; holly silvered and kept for stars, moon and windows
    const night = ['#DCDDD8', '#5E5A50', '#54432C', '#4E3023', '#2C1D14', '#2A1512', '#3C4646', '#19130E', '#0C0908', '#C2A85E'];
    for (let i = 0; i < 10; i++) w[i].copy(hex(night[i]));
  }
}

export default {
  id: 'roll-top-harbour',
  name: 'The Roll-Top Sea',
  category: 'city',
  weirdness: 0.6,
  media: ['air', 'open', 'water'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const look = chooseLook(ctx), rng = ctx.rng.fork('roll-top-world');
    const style = await createStyle(ctx, { ceil: 0.95, exposure: 1 });
    applyCabinet(style, look);
    style.uniforms.uSun.value.copy(look.sun);
    style.uniforms.uKerfFar.value = 260;
    await ctx.yield();
    const hero = await buildHero(ctx, { frame: 'course', style, ringZ: RING_Z - QUAY_Z, sunSide: look.side });
    hero.object.position.set(0, 0, QUAY_Z); hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    hero.setSwell(look.swell);
    hero.sea.uPale.value = 0;
    await ctx.yield();
    const sky = buildSky(style, rng.fork('sky'), look); scene.add(sky.mesh);

    // the course: dead straight along +Z (the brief's line), so the sea wall stands on the vanishing point all the way
    const path = makePath([[0, 10, 0], [0, 10, 30], [0, 9.6, 62], [0, 7.6, 115], [0, 5.6, 170], [0, 5, 210], [0, 5, 246], [0, 4.2, 268], [0, 3.2, 296], [0, 3, 340], [0, 3, 400],
      [0, 5.2, 436], [0, 9.6, 466], [0, 12, 485], [0, 12, 515], [0, 12, RING_Z]]);
    const pieceMat = style.pieceMaterial();
    const leafU = { ...style.uniforms, uCamZ: { value: 0 } };
    const leafMat = new THREE.ShaderMaterial({ uniforms: leafU, vertexShader: LEAF_VERT, fragmentShader: leafFrag(style.tone), side: THREE.DoubleSide, fog: false, toneMapped: false });
    const W = { ctx, scene, style, look, rng, hero, path, pieceMat, leafMat, leafU, leaves: new LeafSet(), live: [], sun: look.sun,
      // add a finished PieceBuilder to the scene as one mesh
      mesh(pb, parent) { const m = new THREE.Mesh(pb.build(), pieceMat); (parent || scene).add(m); return m; } };
    await buildStudy(W); await ctx.yield();
    await buildStreet(W); await ctx.yield();
    await buildPiazza(W); await ctx.yield();
    await buildHarbour(W); await ctx.yield();
    await buildFleet(W); await ctx.yield();
    await buildBirds(W); await ctx.yield();
    await buildShavings(W); await ctx.yield();
    if (look.rare) { await buildLid(W); await ctx.yield(); }
    await ctx.yield();
    scene.add(W.leaves.build(leafMat));
    await ctx.yield();
    return finish(W, sky);
  },
};

// ---------------------------------------------------------------- joiner's helpers (all in world metres)
const AX = V3(1, 0, 0), AY = V3(0, 1, 0), AZ = V3(0, 0, 1);
const at = (o, u, a, v, b, n, c) => { const p = o.clone().addScaledVector(u, a).addScaledVector(v, b); if (n) p.addScaledVector(n, c); return p; };
// "a round thing is a row of graded strips": species by how a face stands to the sun
function grade(n, sun, warm) {
  const d = n.dot(sun);
  return d > 0.6 ? S.holly : d > 0.28 ? (warm ? S.oak : S.sycamore) : d > 0.0 ? (warm ? S.pear : S.oak) : d > -0.32 ? S.walnut : d > -0.66 ? S.rosewood : S.bogoak;
}
// a wall of panels: origin o, unit u (along) and v (up), W x H metres in nu x nv pieces. fn(i, j) -> { sp, ang, inlay } or null
function panelGrid(pb, o, u, v, Wd, Hd, nu, nv, fn) {
  const n = new THREE.Vector3().crossVectors(u, v).normalize(), du = Wd / nu, dv = Hd / nv;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const f = fn(i, j); if (!f) continue;
    const a = at(o, u, i * du, v, j * dv), b = at(o, u, (i + 1) * du, v, j * dv), c = at(o, u, (i + 1) * du, v, (j + 1) * dv), d = at(o, u, i * du, v, (j + 1) * dv);
    pb.quad(a, b, c, d, f);
    if (f.inlay !== undefined) {                 // a lozenge of another wood let into the middle
      const m = at(o, u, (i + 0.5) * du, v, (j + 0.5) * dv, n, 0.02), r = Math.min(du, dv) * (f.inlayR ?? 0.3);
      pb.quad(at(m, u, -r, v, 0), at(m, u, 0, v, -r), at(m, u, r, v, 0), at(m, u, 0, v, r), { sp: f.inlay, ang: 0.785 + (f.ang || 0) });
    }
  }
}
// one flat piece given by its centre, two unit axes and half sizes
function slab(pb, c, u, v, hu, hv, o) { return pb.quad(at(c, u, -hu, v, -hv), at(c, u, hu, v, -hv), at(c, u, hu, v, hv), at(c, u, -hu, v, hv), o); }
// a box standing on y0: centre x, z; size sx, sy, sz
function box(pb, x, y0, z, sx, sy, sz, o) { return pb.block(new THREE.Matrix4().makeTranslation(x, y0 + sy / 2, z), sx, sy, sz, o); }
// a turned post: n graded facets, profile [[y, r], ...] about the vertical through (x, z)
function turned(pb, x, z, prof, n, sun, warm, y0 = 0) {
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2, nn = V3(Math.cos(am), 0.15, Math.sin(am)).normalize(), A = [], B = [];
    for (const [y, r] of prof) { A.push(V3(x + r * Math.cos(a0), y0 + y, z + r * Math.sin(a0))); B.push(V3(x + r * Math.cos(a1), y0 + y, z + r * Math.sin(a1))); }
    pb.strip(A, B, { sp: grade(nn, sun, warm) });
  }
}
// a flat ring of pieces (annulus) round centre c in the plane of unit axes u, v
function annulus(pb, c, u, v, r0, r1, n, fn, a0 = 0, a1 = Math.PI * 2) {
  for (let k = 0; k < n; k++) {
    const b0 = a0 + ((a1 - a0) * k) / n, b1 = a0 + ((a1 - a0) * (k + 1)) / n, P = (r, a) => at(c, u, r * Math.cos(a), v, r * Math.sin(a));
    pb.quad(P(r0, b0), P(r0, b1), P(r1, b1), P(r1, b0), fn(k));
  }
}
// an inlaid shadow on the floor: the footprint edge a -> b of something h high, thrown away from the sun
function floorShadow(pb, W, a, b, h, y, o = {}) {
  const s = W.sun, k = (h * W.look.shLen * 0.62) / Math.max(s.y, 0.2) * (W.look.golden ? 0.27 : 1), dx = -s.x * k, dz = -s.z * k;
  const a2 = V3(a.x, y, a.z), b2 = V3(b.x, y, b.z);
  pb.quad(a2, b2, V3(b.x + dx, y, b.z + dz), V3(a.x + dx, y, a.z + dz), { sp: o.sp ?? S.bogoak, scorch: 1, ang: o.ang ?? 0.6 });
}

// ---------------------------------------------------------------- the study (six times life): z 0-30, 30 m wide, 21 m high
async function buildStudy(W) {
  const { ctx, look, sun } = W, rng = W.rng.fork('study'), pb = W.style.builder();
  const HW = 15, H = 21, L = 30;
  // floor: basket-weave parquet, three boards to a block, blocks turned a quarter in turn (they swap light and dark as we cross)
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) {
    const x0 = -HW + i * 2.5, z0 = j * 2.5, alt = (i + j) % 2;
    for (let k = 0; k < 3; k++) {
      const a = alt ? V3(x0 + (k * 2.5) / 3, 0, z0) : V3(x0, 0, z0 + (k * 2.5) / 3), sx = alt ? 2.5 / 3 : 2.5, sz = alt ? 2.5 : 2.5 / 3;
      const o = { sp: k === 1 ? S.sycamore : (i * 7 + j * 3 + k) % 5 === 0 ? S.pear : S.oak, ang: 0 };
      alt ? pb.quad(V3(a.x, 0, a.z + sz), V3(a.x, 0, a.z), V3(a.x + sx, 0, a.z), V3(a.x + sx, 0, a.z + sz), o) : pb.quad(a, V3(a.x + sx, 0, a.z), V3(a.x + sx, 0, a.z + sz), V3(a.x, 0, a.z + sz), o);
    }
  }
  await ctx.yield();
  // ceiling: coffers, each a frame of four mitred rails round a field with a holly rosette lozenge
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    const c = V3(-HW + 3 + i * 6, H, 3 + j * 6);
    slab(pb, c, AX, AZ, 3, 3, { sp: S.walnut, ang: (i + j) % 2 ? 0 : 1.5708 });
    slab(pb, V3(c.x, H - 0.5, c.z), AX, AZ, 2.2, 2.2, { sp: (i + j) % 2 ? S.oak : S.sycamore, ang: (i + j) % 2 ? 0.785 : -0.785 });
    slab(pb, V3(c.x, H - 0.53, c.z), V3(0.707, 0, 0.707), V3(-0.707, 0, 0.707), 1.0, 1.0, { sp: S.holly });
    for (let k = 0; k < 4; k++) { const d = [AX, AZ, AX.clone().negate(), AZ.clone().negate()][k], t = [AZ, AX, AZ, AX][k]; slab(pb, V3(c.x, H - 0.25, c.z).addScaledVector(d, 2.2), t, AY, 2.2, 0.25, { sp: k < 2 ? S.rosewood : S.bogoak }); }
  }
  await ctx.yield();
  // the two long walls: dado, bench, cupboards with pictures, frieze, cornice
  for (const side of [1, -1]) {
    const x = side * HW, n = V3(-side, 0, 0), u = V3(0, 0, side);         // u runs so that u x up = into the room
    const o = V3(x, 0, side > 0 ? 0 : L);
    panelGrid(pb, o, u, AY, L, 4, 10, 2, (i, j) => ({ sp: j ? S.oak : S.walnut, ang: (i + j) % 2 ? 0 : 1.5708, inlay: j && i % 2 ? S.sycamore : undefined }));
    panelGrid(pb, at(o, u, 0, AY, 18), u, AY, L, 3, 15, 1, (i) => ({ sp: i % 2 ? S.oak : S.pear, ang: i % 2 ? 0.5 : -0.5, inlay: i % 2 ? S.walnut : S.holly, inlayR: 0.26 }));
    slab(pb, V3(x - side * 0.25, 17.75, L / 2), AZ, AY, L / 2, 0.25, { sp: S.ebony }); slab(pb, V3(x - side * 0.3, 18.2, L / 2), AZ, AY, L / 2, 0.12, { sp: S.holly });
    box(pb, x - side * 0.4, 20.2, L / 2, 0.8, 0.8, L, { sp: S.rosewood, sides: S.rosewood, top: S.bogoak });
    box(pb, x - side * 1.4, 0, L / 2, 2.8, 2.6, L, { sp: S.oak, top: S.oak, sides: S.walnut, ends: S.walnut });               // the bench
    for (let i = 0; i < 10; i++) slab(pb, V3(x - side * 1.4, 2.62, 1.5 + i * 3), AZ, AX, 1.35, 1.25, { sp: i % 2 ? S.sycamore : S.oak, ang: i % 2 ? 0 : 1.5708 });
    floorShadow(pb, W, V3(x - side * 2.8, 0, 0), V3(x - side * 2.8, 0, L), side === look.side ? 2.6 : 0.01, 0.02);
    for (let c = 0; c < 3; c++) {
      const z0 = 1.5 + c * 9.5, zc = z0 + 4, pilZ = [z0 - 0.75, z0 + 8.75];
      for (const pz of c === 0 ? pilZ : [pilZ[1]]) for (let k = 0; k < 5; k++) slab(pb, V3(x - side * 0.12, 11, pz - 0.6 + k * 0.3), AZ, AY, 0.15, 7, { sp: [S.walnut, S.pear, S.oak, S.pear, S.walnut][side * look.side > 0 ? k : 4 - k] });
      slab(pb, V3(x - side * 0.02, 11, zc), AZ, AY, 4, 7, { sp: S.bogoak, ang: 1.5708 });                                        // the cupboard's dark ground
      cupboardPicture(W, pb, side, zc, c, rng);
      // real lattice doors, standing half open and swinging a little
      for (const e of [-1, 1]) W.leaves.add(V3(x - side * 0.15, 11, zc + e * 4), V3(0, 0, -e), AY, 4, 13.6, { sp: S.oak, sp2: S.pear, shape: 1, ga: 1.5708,
        base: e * side * (c === 1 ? (e < 0 ? 1.66 : 1.42) + 0 * rng() : e < 0 ? 0.22 + 0.2 * rng() : 1.05 + 0.4 * rng()), amp: (c === 1 ? 0.5 : 1) * (0.06 + 0.05 * rng()), rate: 0.5 + 0.4 * rng(), phase: rng() * 6.28 });
    }
    await ctx.yield();
  }
  W.studyPb = pb;
  await buildStudyEnd(W, pb, rng);
  W.mesh(pb);
}

// The cupboard pictures: a real little interior (recess, shelves, a scholar's things as flat cut-outs) built behind
// the wall and then PROJECTED onto the wall from the entry eye point, so the perspective is right from one place
// only and shears as we pass. Everything ends up as flat inlay, nearer things a hair prouder.
const EYE = V3(0, 10, 0), CUP_D = 3.6;
function projectPicture(pb, from, side, HW) {
  const p = new THREE.Vector3(), q = new THREE.Vector3(), t3 = new THREE.Vector3();
  const pr = (v) => { const d = Math.max(0, side * v.x - HW), plane = HW - 0.03 - (CUP_D - d) * 0.02, t = (plane - side * EYE.x) / Math.max(1e-3, side * v.x - side * EYE.x); return v.sub(EYE).multiplyScalar(t).add(EYE); };
  for (let i = from; i < pb.nv; i++) {
    p.fromArray(pb.P, i * 3); t3.fromArray(pb.T, i * 3); q.copy(p).addScaledVector(t3, 0.2);
    pr(p); pr(q); q.sub(p); if (q.lengthSq() > 1e-10) q.normalize(); else q.set(0, 1, 0);
    p.toArray(pb.P, i * 3); q.toArray(pb.T, i * 3); pb.N[i * 3] = -side; pb.N[i * 3 + 1] = 0; pb.N[i * 3 + 2] = 0;
  }
}
function cupboardPicture(W, pb, side, zc, c, rng) {
  const HW = 15, from = pb.mark(), X = (d) => side * (HW + d), tOf = (d) => HW / (HW + d);
  const zn = (d) => (zc - 4) / tOf(d) + 0.06, zf = zc + 4, u = AZ, flat = (d) => V3(X(d), 0, 0);
  const P = (d, y, z) => V3(X(d), y, z);
  // the recess: back, the far cheek, floor, top and two shelves
  for (let k = 0; k < 2; k++) { const za = zn(CUP_D) + ((zf - zn(CUP_D)) * k) / 2, zb = zn(CUP_D) + ((zf - zn(CUP_D)) * (k + 1)) / 2; pb.quad(P(CUP_D, 4, za), P(CUP_D, 4, zb), P(CUP_D, 18, zb), P(CUP_D, 18, za), { sp: S.walnut, ang: k ? 1.4 : 1.74 }); }
  pb.quad(P(0, 4, zf), P(CUP_D, 4, zf), P(CUP_D, 18, zf), P(0, 18, zf), { sp: side * W.look.side > 0 ? S.rosewood : S.walnut, ang: 1.5708 });
  for (const [y, sp] of [[4.02, S.oak], [8.5, S.oak], [13.5, S.pear], [17.98, S.bogoak]]) pb.quad(P(0, y, zn(0)), P(0, y, zf), P(CUP_D, y, zf), P(CUP_D, y, zn(CUP_D)), { sp, ang: 0 });
  for (const y of [8.5, 13.5]) pb.quad(P(0, y - 0.35, zn(0)), P(0, y - 0.35, zf), P(0, y, zf), P(0, y, zn(0)), { sp: S.holly });          // shelf edges
  // what a scholar keeps
  const kinds = [['books', 'lute', 'books'], ['hourglass', 'books', 'ring'], ['books', 'lute', 'books'], ['books', 'armillary', 'books'], ['lute', 'books', 'armillary'], ['ring', 'books', 'books']][(side > 0 ? 0 : 3) + c];
  const shelfY = [4.02, 8.5, 13.5];
  for (let s = 0; s < 3; s++) {
    // show: the one shelf the entry eye sees between the two open doors of the middle cupboard (wall z 15.3-18.5,
    // the outer eighth of the entry frame, at eye height): three books in three pale woods and one thing, standing
    // at the very front of the shelf against the dark cheek. Port: the caged finch. Starboard: the hourglass.
    const show = c === 1 && s === 1, y0 = shelfY[s], d = show ? 0.35 : 1.9, zb = show ? zf - 0.12 : zf - 0.5;
    let za = show ? 15.75 / tOf(d) : zn(d) + 0.5;
    if (show) {
      const woods = side > 0 ? [S.sycamore, S.pear, S.holly] : [S.holly, S.oak, S.sycamore], hs = [3.5, 2.8, 3.2];
      for (let k = 0; k < 3; k++) {
        pb.quad(P(d, y0, za), P(d, y0, za + 0.4), P(d, y0 + hs[k], za + 0.4), P(d, y0 + hs[k], za), { sp: woods[k], ang: 1.5708 });
        pb.quad(P(d - 0.02, y0 + hs[k] * 0.7, za + 0.03), P(d - 0.02, y0 + hs[k] * 0.7, za + 0.37), P(d - 0.02, y0 + hs[k] * 0.8, za + 0.37), P(d - 0.02, y0 + hs[k] * 0.8, za + 0.03), { sp: woods[k] === S.pear ? S.holly : S.rosewood });
        za += 0.42;
      }
      za += 0.08;
    }
    const zm = (za + zb) / 2, hw = show ? (zb - za) / 2 : 1, kind = show ? (side > 0 ? 'cage' : 'hourglass') : kinds[s];
    if (kind === 'books') {
      let z = za; const lean = rng() < 0.5;
      while (z < zb - 0.5) {
        const w = 0.34 + 0.4 * rng(), h = 2.5 + 1.2 * rng(), sp = [S.pear, S.oak, S.walnut, S.rosewood, S.sycamore, S.harewood, S.holly][Math.floor(rng() * 7)];
        const sk = lean && z > zb - 2 ? 0.5 : 0;
        pb.quad(P(d, y0, z), P(d, y0, z + w), P(d, y0 + h, z + w - sk), P(d, y0 + h, z - sk), { sp, ang: 1.5708 });
        pb.quad(P(d - 0.02, y0 + h * 0.7, z + 0.03 - sk * 0.7), P(d - 0.02, y0 + h * 0.7, z + w - 0.03 - sk * 0.7), P(d - 0.02, y0 + h * 0.8, z + w - 0.03 - sk * 0.8), P(d - 0.02, y0 + h * 0.8, z + 0.03 - sk * 0.8), { sp: sp === S.holly || sp === S.sycamore ? S.ebony : S.holly });
        z += w + (rng() < 0.12 ? 0.5 : 0.02);
      }
    } else if (kind === 'hourglass') {
      for (const yy of [0, 3.3]) pb.quad(P(d, y0 + yy, zm - hw), P(d, y0 + yy, zm + hw), P(d, y0 + yy + 0.3, zm + hw), P(d, y0 + yy + 0.3, zm - hw), { sp: show ? S.pear : S.rosewood });
      pb.quad(P(d, y0 + 0.3, zm - 0.75 * hw), P(d, y0 + 0.3, zm + 0.75 * hw), P(d, y0 + 1.75, zm + 0.1), P(d, y0 + 1.75, zm - 0.1), { sp: S.holly, ang: 1.5708 });
      pb.quad(P(d, y0 + 1.85, zm - 0.1), P(d, y0 + 1.85, zm + 0.1), P(d, y0 + 3.3, zm + 0.75 * hw), P(d, y0 + 3.3, zm - 0.75 * hw), { sp: S.sycamore, ang: 1.5708 });
      for (const e of [-0.92 * hw, 0.92 * hw]) pb.quad(P(d - 0.02, y0 + 0.3, zm + e - 0.07), P(d - 0.02, y0 + 0.3, zm + e + 0.07), P(d - 0.02, y0 + 3.3, zm + e + 0.07), P(d - 0.02, y0 + 3.3, zm + e - 0.07), { sp: show ? S.oak : S.pear, ang: 1.5708 });
    } else if (kind === 'lute') {
      const cc = P(d, y0 + 1.6, zm - 0.5), a = V3(0, 0.34, 0.94), b = V3(0, 0.94, -0.34);
      annulus(pb, cc, a, b, 0.42, 1.45, 10, (k) => ({ sp: k % 2 ? S.sycamore : S.oak, ang: 1.5708 }));
      annulus(pb, cc.clone().add(flat(0).set(side * -0.02, 0, 0)), a, b, 0.02, 0.42, 8, (k) => ({ sp: k % 2 ? S.ebony : S.walnut }));
      slab(pb, at(cc, a, 2.5, b, 0), a, b, 1.25, 0.16, { sp: S.ebony }); slab(pb, at(cc, a, 3.9, b, -0.25), a, b, 0.2, 0.45, { sp: S.pear });
    } else if (kind === 'ring' || kind === 'armillary') {
      const cc = P(d, y0 + (kind === 'ring' ? 1.15 : 2.1), zm);
      if (kind === 'ring') annulus(pb, cc, AZ, V3(side * 0.9, 0.42, 0), 1.0, 1.75, 16, (k) => ({ sp: k % 2 ? S.boxwood : S.ebony, ang: k % 4 < 2 ? 0 : 1.5708 }));
      else {
        for (let r = 0; r < 3; r++) { const tl = [0.2, 1.0, -0.7][r], v = V3(0, Math.cos(tl), Math.sin(tl)), uu = V3(side * 0.35, -Math.sin(tl) * 0.94, Math.cos(tl) * 0.94).normalize(); annulus(pb, at(cc, AX, -side * 0.02 * r, AY, 0), uu, v, 1.45 - r * 0.22, 1.62 - r * 0.22, 14, (k) => ({ sp: [S.oak, S.holly, S.pear][r] })); }
        pb.quad(P(d, y0, zm - 0.5), P(d, y0, zm + 0.5), P(d, y0 + 0.5, zm + 0.12), P(d, y0 + 0.5, zm - 0.12), { sp: S.rosewood });
      }
    } else if (kind === 'cage') {                 // the lattice cage; the finch (or squirrel) is a separate sliding inlay
      const cz = zm, w = show ? hw - 0.06 : 1.9, h = show ? 3.6 : 3.9, nb = show ? 5 : 8, kw = w / 1.9, fz = show ? 0.62 : 1;
      for (let k = 0; k <= nb; k++) { const z = cz - w + (2 * w * k) / nb; pb.quad(P(d - 0.03, y0 + 0.3, z - 0.035), P(d - 0.03, y0 + 0.3, z + 0.035), P(d - 0.03, y0 + h, z + 0.035), P(d - 0.03, y0 + h, z - 0.035), { sp: S.sycamore, ang: 1.5708 }); }
      for (const yy of [0.1, h]) pb.quad(P(d - 0.03, y0 + yy, cz - w - 0.1), P(d - 0.03, y0 + yy, cz + w + 0.1), P(d - 0.03, y0 + yy + 0.22, cz + w + 0.1), P(d - 0.03, y0 + yy + 0.22, cz - w - 0.1), { sp: S.oak });
      for (const [pz, py] of [[cz - 1.05 * kw, 1.5], [cz + 1.0 * kw, 2.5]]) pb.quad(P(d + 0.02, y0 + py, pz - 0.6 * kw - 0.05), P(d + 0.02, y0 + py, pz + 0.6 * kw + 0.05), P(d + 0.02, y0 + py + 0.1, pz + 0.6 * kw + 0.05), P(d + 0.02, y0 + py + 0.1, pz - 0.6 * kw - 0.05), { sp: show ? S.oak : S.walnut });
      const fb = W.style.builder(), fo = P(d + 0.01, 0, 0), sq = W.look.pet === 'squirrel', body = sq ? S.pear : S.holly;
      const by = y0 + 1.6, bz = cz - 1.05 * kw, loz = (y, z, ry, rz, sp) => fb.quad(V3(fo.x, by + y * fz, bz + (z - rz) * fz), V3(fo.x, by + (y - ry) * fz, bz + z * fz), V3(fo.x, by + y * fz, bz + (z + rz) * fz), V3(fo.x, by + (y + ry) * fz, bz + z * fz), { sp, ang: 0.785 });
      loz(0.42, 0, 0.36, 0.6, body); loz(0.78, 0.5, 0.2, 0.24, sq ? S.pear : S.oak); loz(0.4, -0.7, 0.14, 0.42, sq ? S.oak : S.walnut); loz(0.74, 0.76, 0.05, 0.12, S.ebony);
      if (sq) { annulus(fb, V3(fo.x, by + 0.9 * fz, bz - 0.75 * fz), AZ, AY, 0.22 * fz, 0.6 * fz, 8, (k) => ({ sp: k % 2 ? S.oak : S.pear }), -0.6, 3.4); loz(0.5, 0.85, 0.13, 0.13, S.walnut); }
      projectPicture(fb, 0, side, HW);
      W.finch = { mesh: W.mesh(fb), d: V3(0, 1.0 * tOf(d), 2.05 * kw * tOf(d)) };
    }
  }
  projectPicture(pb, from, side, HW);
}

// the end wall (z 30) and the window panel: two inlaid leaves sliding apart in their grooves
async function buildStudyEnd(W, pb, rng) {
  const { look } = W, Z = 30, u = AX.clone().negate();
  for (const side of [1, -1]) {
    const o = V3(side > 0 ? 15 : -8, 0, Z);
    panelGrid(pb, o, u, AY, 7, 21, 2, 7, (i, j) => ({ sp: j === 0 ? S.walnut : (i + j) % 2 ? S.oak : S.sycamore, ang: (i + j) % 2 ? 0.785 : -0.785, inlay: j > 0 && (i + j) % 2 ? S.holly : j > 0 ? S.pear : undefined, inlayR: 0.22 }));
    for (let k = 0; k < 5; k++) slab(pb, V3(side * (8.1 + k * 0.22), 10, Z - 0.1), AX, AY, 0.11, 8, { sp: [S.holly, S.sycamore, S.oak, S.pear, S.walnut][side * look.side > 0 ? 4 - k : k], ang: 1.5708 });   // jamb pilasters, graded
  }
  panelGrid(pb, V3(8, 18, Z), u, AY, 16, 3, 8, 1, (i) => ({ sp: i % 2 ? S.rosewood : S.walnut, ang: i % 2 ? 0 : 1.5708, inlay: i % 2 ? S.holly : S.sycamore, inlayR: 0.3 }));
  panelGrid(pb, V3(8, 0, Z), u, AY, 16, 2, 8, 1, (i) => ({ sp: i % 2 ? S.walnut : S.pear, ang: i % 2 ? 1.5708 : 0 }));
  slab(pb, V3(0, 18.15, Z - 0.12), AX, AY, 9.3, 0.15, { sp: S.ebony }); slab(pb, V3(0, 18.45, Z - 0.12), AX, AY, 9.3, 0.1, { sp: S.holly });
  slab(pb, V3(0, 1.9, Z - 0.12), AX, AY, 9.3, 0.12, { sp: S.ebony });
  slab(pb, V3(0, 2, Z + 0.3), AX, AZ, 8, 0.5, { sp: S.walnut });                               // the sill with its two grooves
  // the leaves: a field of squares turned a quarter in turn, each with a star lozenge, in a rosewood frame
  W.windowLeaves = [];
  for (const side of [1, -1]) {
    const lb = W.style.builder(), o = V3(side > 0 ? 8 : 0, 2, 0);
    panelGrid(lb, o, u, AY, 8, 16, 4, 8, (i, j) => { const k = (i + j) % 2; return { sp: k ? S.oak : S.sycamore, ang: k ? 0 : 1.5708, inlay: (i + j) % 3 === 0 ? S.walnut : k ? S.holly : S.pear, inlayR: 0.34 }; });
    for (const [cx, cy, hw, hh] of [[4, 2.3, 4, 0.3], [4, 17.7, 4, 0.3], [0.3, 10, 0.3, 8], [7.7, 10, 0.3, 8]]) slab(lb, V3((side > 0 ? 0 : -8) + cx, cy, -0.03), AX, AY, hw, hh, { sp: S.rosewood, ang: hw > hh ? 0 : 1.5708 });
    slab(lb, V3(side > 0 ? 0.75 : -0.75, 10, -0.06), AX, AY, 0.12, 0.9, { sp: S.holly });      // a holly pull
    const m = W.mesh(lb); m.position.set(side * 4, 0, Z + 0.35); m.frustumCulled = false;
    W.windowLeaves.push({ mesh: m, side });
  }
  await W.ctx.yield();
}

// ---------------------------------------------------------------- the street: z 30-200, 18 m wide, arcaded palaces
const PAL_SCHEMES = [[S.oak, S.pear, S.holly], [S.sycamore, S.oak, S.walnut], [S.pear, S.walnut, S.holly], [S.holly, S.sycamore, S.pear], [S.oak, S.sycamore, S.rosewood], [S.sycamore, S.pear, S.walnut]];
// one palace: front on the plane x = side*fx, from z0 for nb bays of 6 m, hgt tall. far = plainer, larger pieces.
function palace(W, pb, side, z0, nb, hgt, idx, o = {}) {
  const { look, sun } = W, fx = o.fx ?? 9, depth = o.depth ?? 16, len = nb * 6, x = side * fx, Y = PAVE, n = V3(-side, 0, 0);
  const u = V3(0, 0, side), org = V3(x, Y, side > 0 ? z0 : z0 + len), zAt = (a) => (side > 0 ? z0 + a : z0 + len - a);
  const sch = PAL_SCHEMES[(idx + (o.sch ?? 0)) % PAL_SCHEMES.length], diag = idx % 3 === 1, lit = side !== look.side, far = !!o.far;
  const AH = 11, rA = 2.3, spring = 7.2;
  // piers (graded: the face to the sun is the palest), imposts, arches as fans of voussoirs
  for (let b = 0; b <= nb; b++) {
    const pz = zAt(b * 6);
    box(pb, x + side * 0.6, Y, pz, 1.2, spring, 1.4, { sp: grade(n, sun, 1), sides: grade(V3(0, 0, 1), sun, 1), ends: grade(n, sun, 1), ang: 1.5708 });
    pb.quad(V3(x - side * 0.01, Y, pz - 0.7), V3(x - side * 0.01, Y, pz + 0.7), V3(x - side * 0.01, Y + 1.1, pz + 0.7), V3(x - side * 0.01, Y + 1.1, pz - 0.7), { sp: S.rosewood });
    box(pb, x + side * 0.6, Y + spring, pz, 1.5, 0.45, 1.7, { sp: S.ebony, sides: S.holly, ends: S.holly, top: S.ebony });
    if (!far && !lit) floorShadow(pb, W, V3(x, 0, pz - 0.7), V3(x, 0, pz + 0.7), 5.5, Y + 0.025);
  }
  const angs = [0, 25, 49.4, 70, 90, 110, 130.6, 155, 180].map((a) => a * DEG), sy = Y + spring + 0.45;
  for (let b = 0; b < nb; b++) {
    const zc = b * 6 + 3, A = (a) => at(org, u, zc + rA * Math.cos(a), AY, sy - Y + rA * Math.sin(a));
    const Bp = (a) => { const c = Math.cos(a), s = Math.sin(a), t = Math.min(3 / Math.max(Math.abs(c), 1e-3), (Y + AH - sy) / Math.max(s, 1e-3)); return at(org, u, zc + (Math.abs(c) < 1e-3 ? 0 : t * c), AY, sy - Y + t * s); };
    for (let k = 0; k < 8; k++) pb.quad(A(angs[k]), Bp(angs[k]), Bp(angs[k + 1]), A(angs[k + 1]), { sp: k === 3 || k === 4 ? sch[2] : k % 2 ? sch[0] : sch[1], ang: k % 2 ? 0.3 : -0.3 });
    // the loggia: floor, ceiling and back wall are in the palace's own shadow (walnut and bog oak), doors in holly lines
    const bx = x + side * 4.5, za = zAt(b * 6), zb = zAt(b * 6 + 6), z1 = Math.min(za, zb), z2 = Math.max(za, zb);
    pb.quad(V3(x, Y + AH, z1), V3(bx, Y + AH, z1), V3(bx, Y + AH, z2), V3(x, Y + AH, z2), { sp: b % 2 ? S.bogoak : S.walnut, ang: 1.5708 });
    pb.quad(V3(x + side * 1.2, Y + 0.01, z1), V3(x + side * 1.2, Y + 0.01, z2), V3(bx, Y + 0.01, z2), V3(bx, Y + 0.01, z1), { sp: lit ? S.oak : S.walnut, ang: b % 2 ? 0 : 1.5708 });
    panelGrid(pb, V3(bx, Y, side > 0 ? z1 : z2), u, AY, 6, AH, 3, 2, (i, j) => ({ sp: i === 1 && j === 0 ? S.bogoak : (i + j) % 2 ? S.walnut : S.rosewood, ang: (i + j) % 2 ? 0 : 1.5708, inlay: i === 1 && j === 0 ? (look.night ? S.holly : S.pear) : undefined, inlayR: 0.2 }));
    if (lit && !far) { const k = 3.2; pb.quad(V3(x + side * 1.25, Y + 0.03, z1 + 0.9 - k * 0.35), V3(x + side * 1.25, Y + 0.03, z2 - 0.9 - k * 0.35), V3(bx - side * 0.1, Y + 0.03, z2 - 0.9 - k), V3(bx - side * 0.1, Y + 0.03, z1 + 0.9 - k), { sp: S.sycamore, ang: 0.7 }); }
  }
  // string course, upper wall of panels with the grain turned panel by panel, pilasters, windows, cornice
  const y1 = AH + 0.6, y2 = hgt - 1.6, nu = far ? nb * 2 : nb * 4, nv = far ? 3 : 6;
  for (const [ya, yb, sp] of [[AH, AH + 0.22, S.ebony], [AH + 0.22, AH + 0.4, S.holly], [AH + 0.4, y1, S.rosewood]]) for (let b = 0; b < nb; b++) pb.quad(at(org, u, b * 6, AY, ya, n, 0.12), at(org, u, b * 6 + 6, AY, ya, n, 0.12), at(org, u, b * 6 + 6, AY, yb, n, 0.12), at(org, u, b * 6, AY, yb, n, 0.12), { sp });
  panelGrid(pb, at(org, u, 0, AY, y1), u, AY, len, y2 - y1, nu, nv, (i, j) => {
    const k = (i + j) % 2, a = diag ? (k ? 0.785 : -0.785) : (k ? 0 : 1.5708);
    return { sp: (j === 0 || j === nv - 1) && !far ? sch[1] : k ? sch[0] : (i * 5 + j * 3 + idx) % 7 === 0 ? sch[2] : sch[0], ang: a + ((i * 13 + j * 7 + idx) % 5 - 2) * 0.05,
      inlay: !far && j === nv - 1 && i % 2 ? sch[2] : undefined, inlayR: 0.24, move: !far && idx === (o.lift ?? -1) && i === 5 && j === 2 ? 0.16 : 0 };
  });
  for (let b = 0; b <= nb; b++) for (let k = 0; k < 5; k++) {                        // pilasters: five graded strips
    const pz = b * 6 - 0.45 + k * 0.18 + 0.09, order = [S.holly, S.sycamore, S.oak, S.pear, S.walnut], kk = sun.z * side > 0 ? 4 - k : k;
    pb.quad(at(org, u, pz - 0.09, AY, y1, n, 0.07), at(org, u, pz + 0.09, AY, y1, n, 0.07), at(org, u, pz + 0.09, AY, y2, n, 0.07), at(org, u, pz - 0.09, AY, y2, n, 0.07), { sp: lit ? order[kk] : order[Math.min(4, kk + 1)], ang: 1.5708 });
  }
  const hW = y2 - y1;
  for (let b = 0; b < nb; b++) for (const [wy, ww, wh] of far ? [[0.2 * hW, 1.7, 0.42 * hW]] : [[0.13 * hW, 1.7, 0.4 * hW], [0.68 * hW, 1.3, 0.18 * hW]]) {
    const c = at(org, u, b * 6 + 3, AY, y1 + wy + wh / 2, n, 0.03);
    slab(pb, c, u, AY, ww / 2 + 0.22, wh / 2 + 0.22, { sp: sch[2] === S.holly ? S.holly : S.sycamore, ang: 1.5708 });
    slab(pb, at(c, n, 0.02, AY, 0), u, AY, ww / 2, wh / 2, { sp: look.night && (b * 3 + idx) % 4 === 0 ? S.holly : S.bogoak, scorch: 1, ang: 1.5708 });
    slab(pb, at(c, n, 0.2, AY, -wh / 2 - 0.3), u, n, ww / 2 + 0.4, 0.2, { sp: S.pear });
    if (W.shutters) for (const e of [-1, 1]) {      // shutters are cupboard doors on hinges; some swing open as we come
      const r = W.shutters.rng(), key = !far && r < W.shutters.keyP, hz = at(c, u, e * ww / 2, n, 0.06);
      const openA = e * (1.9 + 0.5 * W.shutters.rng());
      W.leaves.add(hz, u.clone().multiplyScalar(-e), AY, ww / 2, wh, { sp: (b + idx) % 2 ? S.walnut : S.pear, sp2: (b + idx) % 2 ? S.pear : S.oak, ga: 1.5708,
        base: key ? 0 : r < 0.6 ? 0 : openA * (0.4 + 0.6 * W.shutters.rng()), amp: key || r > 0.6 ? 0.05 : 0.004, rate: 0.7 + W.shutters.rng(), phase: W.shutters.rng() * 6.28,
        keyZ: key ? hz.z : 0, openAng: key ? openA : 0 });
    }
  }
  const yc = hgt - 1.6, nd = far ? nb * 2 : nb * 6;
  for (let i = 0; i < nd; i++) {
    const a = (len * i) / nd, b2 = (len * (i + 1)) / nd, q = (ya, yb, off, sp, ang) => pb.quad(at(org, u, a, AY, ya, n, off), at(org, u, b2, AY, ya, n, off), at(org, u, b2, AY, yb, n, off), at(org, u, a, AY, yb, n, off), { sp, ang });
    q(yc, yc + 0.55, 0.1, i % 2 ? S.rosewood : S.walnut, 0); q(yc + 0.55, yc + 1.0, 0.3, i % 2 ? S.ebony : S.holly, 1.5708); q(yc + 1.0, yc + 1.6, 0.6, i % 3 ? S.pear : S.oak, 0);
    pb.quad(at(org, u, a, AY, yc + 1.0, n, 0.6), at(org, u, b2, AY, yc + 1.0, n, 0.6), at(org, u, b2, AY, yc + 1.0, n, 0), at(org, u, a, AY, yc + 1.0, n, 0), { sp: S.bogoak });
  }
  // the two flanks (alleys): big plain boards; and the back half is never seen
  for (const zz of [z0, z0 + len]) panelGrid(pb, V3(x, Y, zz), V3(side, 0, 0), AY, depth, hgt, 3, 4, (i, j) => ({ sp: (i + j) % 2 ? sch[0] : sch[1], ang: (i + j) % 2 ? 0 : 1.5708 }));
  pb.quad(V3(x, Y + hgt, z0), V3(x + side * depth, Y + hgt, z0), V3(x + side * depth, Y + hgt, z0 + len), V3(x, Y + hgt, z0 + len), { sp: S.pear });
  // a chimney giving off plane shavings
  if (!far) { const cz = z0 + len * (0.3 + 0.4 * ((idx * 0.37) % 1)); box(pb, x + side * 3, Y + hgt, cz, 1.6, 3.2, 1.6, { sp: S.pear, sides: grade(n, sun, 1), ends: grade(V3(0, 0, 1), sun, 1), top: S.ebony }); W.chimneys.push(V3(x + side * 3, Y + hgt + 3.3, cz)); }
}

// an orange tree in a tub: harewood leaves on little hinges, round pear-wood fruit
function orangeTree(W, pb, x, z, face, rng) {
  box(pb, x, PAVE, z, 1.3, 1.1, 1.3, { sp: S.pear, top: S.bogoak, sides: S.rosewood, ends: grade(V3(face, 0, 0), W.sun, 1) });
  slab(pb, V3(x + face * 0.01, PAVE + 2.6, z), AZ, AY, 0.14, 1.5, { sp: S.walnut, ang: 1.5708 });
  const n = Math.round(24 * W.look.detail);
  for (let i = 0; i < n; i++) {
    const a = rng() * 6.283, r = Math.sqrt(rng()) * 1.8, c = V3(x + face * (0.25 + 0.5 * rng()), PAVE + 5 + r * Math.sin(a) * 0.95, z + r * Math.cos(a)), t = rng() * 3.14;
    W.leaves.add(c, V3(face * 0.25, Math.sin(t), Math.cos(t)), V3(0.1 * face, Math.cos(t), -Math.sin(t)), 1.3, 0.9, { sp: i % 5 === 0 ? S.sycamore : S.harewood, shape: 3, ga: rng() * 3, base: 0, amp: 0.12, rate: 1.6 + rng(), phase: z * 0.3 + rng() });
  }
  for (let i = 0; i < 5; i++) { const a = rng() * 6.283, r = 0.3 + rng() * 0.9; W.leaves.add(V3(x + face * 0.85, PAVE + 5 + r * Math.sin(a), z + r * Math.cos(a) - 0.25), AZ, AY, 0.5, 0.5, { sp: S.pear, shape: 4, ga: 0.5, amp: 0.03, rate: 1.3, phase: i }); }
}
// a cypress: a stack of harewood lozenges, each a little darker on the side away from the sun
function cypress(W, pb, x, z, h, face) {
  const sd = -W.look.side;
  for (let k = 0; k < 9; k++) {
    const f = k / 9, w = h * 0.16 * (1 - f * 0.75) * (k === 0 ? 0.5 : 1), y = PAVE + h * (0.06 + f * 0.9), hh = h * 0.1;
    const c = V3(x + face * k * 0.01, y, z), q = (cx, ww, sp, off) => pb.quad(V3(c.x + face * off, y, cx - ww), V3(c.x + face * off, y - hh, cx), V3(c.x + face * off, y, cx + ww), V3(c.x + face * off, y + hh * 1.5, cx), { sp, ang: 0.9 });
    q(z + sd * face * w * 0.3, w, k % 2 ? S.walnut : S.bogoak, 0); q(z - sd * face * w * 0.12, w * 0.8, S.harewood, 0.03);
  }
}
// a flying arch between two palace fronts (the street's one event: the sea is first framed by it, then we pass under):
// holly and walnut voussoirs on a segmental curve, spandrels with the grain turned panel by panel and a roundel let
// into each, a string of ebony and holly, a panelled parapet; the underside in the dark woods
function streetArch(W, pb, zc) {
  const { sun } = W, hw = 9, ys = PAVE + 12.5, rise = 5, th = 1.25, top = ys + rise + th + 2.1, z0 = zc - 6, z1 = zc + 6, N = 18;
  const yIn = (x) => ys + rise * (1 - (x / hw) * (x / hw));
  for (const face of [-1, 1]) {
    const z = face < 0 ? z0 : z1, P = (x, y, off = 0) => V3(x, y, z + face * off), Q = (a, b, c, d, o) => (face < 0 ? pb.quad(b, a, d, c, o) : pb.quad(a, b, c, d, o));
    for (let i = 0; i < N; i++) {
      const xa = -hw + (2 * hw * i) / N, xb = xa + (2 * hw) / N, key = i === N / 2 - 1 || i === N / 2;
      Q(P(xa, yIn(xa)), P(xb, yIn(xb)), P(xb, yIn(xb) + th), P(xa, yIn(xa) + th), { sp: key ? S.pear : i % 2 ? S.holly : S.walnut, ang: 1.5708 - (i - N / 2 + 0.5) * 0.09 });
      Q(P(xa, yIn(xa) + th), P(xb, yIn(xb) + th), P(xb, top - 1.5), P(xa, top - 1.5), { sp: i % 2 ? S.oak : S.sycamore, ang: i % 2 ? 0.785 : -0.785 });
      Q(P(xa, top - 1.5, 0.1), P(xb, top - 1.5, 0.1), P(xb, top - 1.25, 0.1), P(xa, top - 1.25, 0.1), { sp: S.ebony });
      Q(P(xa, top - 1.25, 0.1), P(xb, top - 1.25, 0.1), P(xb, top - 1.0, 0.1), P(xa, top - 1.0, 0.1), { sp: S.holly });
      Q(P(xa, top - 1.0), P(xb, top - 1.0), P(xb, top), P(xa, top), { sp: i % 2 ? S.rosewood : S.pear, ang: i % 2 ? 0 : 1.5708, inlay: undefined });
    }
    for (const sx of [-1, 1]) {      // a roundel in each spandrel: pear and ebony wedges round a holly boss
      const c = P(sx * 6.7, ys + 5.35, 0.03), u = V3(-face, 0, 0), n = 12;
      annulus(pb, c, u, AY, 0.45, 1.25, n, (k) => ({ sp: k % 2 ? S.pear : S.ebony, ang: 1.5708 }));
      annulus(pb, c, u, AY, 0.03, 0.45, 6, () => ({ sp: S.holly }));
      annulus(pb, c, u, AY, 1.25, 1.42, n, () => ({ sp: S.holly }));
    }
  }
  // the underside is a coffered vault, twelve metres deep (we look up into it as we come and pass beneath): every
  // coffer a dark frame, a field of a lighter wood let in with its grain turned, and a boss in every other one
  const NZ = 6, dz = (z1 - z0) / NZ;
  for (let i = 0; i < N; i++) {
    const xa = -hw + (2 * hw * i) / N, xb = xa + (2 * hw) / N, xm = (xa + xb) / 2, n = V3(2 * rise * xm / (hw * hw), -1, 0).normalize();
    const ya = yIn(xa), yb = yIn(xb), L = (f, g, off) => V3(xa + (xb - xa) * f, ya + (yb - ya) * f, z0 + g).addScaledVector(n, off);
    for (let j = 0; j < NZ; j++) {
      const g0 = j * dz, g1 = g0 + dz, k = (i + j) % 2;
      pb.quad(L(0, g0, 0), L(1, g0, 0), L(1, g1, 0), L(0, g1, 0), { sp: k ? S.walnut : S.bogoak, ang: k ? 0 : 1.5708 });
      pb.quad(L(0.16, g0 + 0.3, 0.03), L(0.84, g0 + 0.3, 0.03), L(0.84, g1 - 0.3, 0.03), L(0.16, g1 - 0.3, 0.03), { sp: k ? grade(n, sun, 1) === S.bogoak ? S.pear : S.oak : S.sycamore, ang: k ? 1.5708 : 0.785 });
      if (k) pb.quad(L(0.5, g0 + dz / 2 - 0.42, 0.05), L(0.72, g0 + dz / 2, 0.05), L(0.5, g0 + dz / 2 + 0.42, 0.05), L(0.28, g0 + dz / 2, 0.05), { sp: (i + j) % 4 === 1 ? S.holly : S.pear, ang: 0.785 });
    }
    pb.quad(V3(xa, top, z1), V3(xb, top, z1), V3(xb, top, z0), V3(xa, top, z0), { sp: i % 2 ? S.pear : S.oak });
  }
}
async function buildStreet(W) {
  const { ctx, look, sun } = W, rng = W.rng.fork('street');
  W.chimneys = []; W.shutters = { rng: W.rng.fork('shutters'), keyP: 0.22 * look.density };
  // the chequered parquet: holly and walnut squares 3 m across; where a palace stands between it and the sun the
  // squares are cut from walnut and bog oak instead (the inlaid shadow), with light let in through the alleys
  const pv = W.style.builder(), gaps = [0, 1, 2, 3, 4].map((k) => 31 + 34 * k + 30), shW = look.golden ? 15 : 6.2, slope = sun.z / Math.max(Math.abs(sun.x), 0.2);
  for (let j = 0; j < 57; j++) for (let i = 0; i < 6; i++) {
    const x0 = -9 + i * 3, z0 = 30 + j * 3, xc = x0 + 1.5, zc = z0 + 1.5, d = 9 - look.side * xc, zs = zc + slope * d;
    let shade = d < shW; for (const g of gaps) if (zs > g - 0.4 && zs < g + 4.4) shade = false;
    const dark = (i + j) % 2 === 1, sp = shade ? (dark ? S.bogoak : look.golden ? S.pear : S.walnut) : dark ? S.walnut : S.holly;
    pv.quad(V3(x0, PAVE, z0 + 3), V3(x0, PAVE, z0), V3(x0 + 3, PAVE, z0), V3(x0 + 3, PAVE, z0 + 3), { sp, ang: dark ? 0 : 1.5708, scorch: shade && !dark ? 0.6 : 0 });
    if (!dark && (i * 3 + j) % 4 === 0) slab(pv, V3(xc, PAVE + 0.012, zc), V3(0.707, 0, 0.707), V3(-0.707, 0, 0.707), 0.5, 0.5, { sp: shade ? S.bogoak : S.pear });
  }
  for (const side of [1, -1]) for (let k = 0; k < 5; k++) {              // alley floors and their closed ends
    const z0 = 31 + 34 * k + 30;
    pv.quad(V3(side * 9, PAVE, z0), V3(side * 9, PAVE, z0 + 4), V3(side * 32, PAVE, z0 + 4), V3(side * 32, PAVE, z0), { sp: side === look.side ? S.oak : S.pear, ang: 1.5708 });
    panelGrid(pv, V3(side * 30, PAVE, side > 0 ? z0 - 3 : z0 + 7), V3(0, 0, side), AY, 10, 30, 2, 3, (i, j) => ({ sp: (i + j) % 2 ? S.sycamore : S.holly, ang: (i + j) % 2 ? 0 : 1.5708 }));
    cypress(W, pv, side * 25, z0 + 2, 21 + 4 * rng(), -side);
  }
  W.mesh(pv); await ctx.yield();
  for (let k = 0; k < 5; k++) {
    const pb = W.style.builder(), z0 = 31 + 34 * k, hgt = [24, 22.5, 24, 21, 19.5][k];
    for (const side of [1, -1]) {
      palace(W, pb, side, z0, 5, hgt + (side > 0 ? 0 : [-1.5, 1.5, -2, 1, 0][k]), k * 2 + (side > 0 ? 0 : 1), { lift: 2 });
      for (const b of [1, 3, 5]) if (rng() < 0.8 * look.density) orangeTree(W, pb, side * 7.45, z0 + b * 6 - 6, -side, rng);
      await ctx.yield();
    }
    if (k === 2) streetArch(W, pb, 111);
    W.mesh(pb);
  }
  // the vine on the port arcade: every leaf a separate piece turning three degrees in its socket as the breeze
  // comes down the street, so a ripple of sheen runs along it
  const nv = Math.round(330 * look.detail);
  for (let i = 0; i < nv; i++) {
    const z = 31.5 + (166 * i) / nv + rng() * 0.4, onPier = ((z - 31) % 34) < 30 && ((z - 31) % 6 < 0.9 || (z - 31) % 6 > 5.1), y = onPier ? PAVE + 2 + rng() * 9 : PAVE + 11.3 + 0.9 * Math.sin(z * 0.9) + rng() * 0.7;
    if (((z - 31) % 34) > 30) continue;
    const t = rng() * 6.283;
    W.leaves.add(V3(8.82 - rng() * 0.05, y, z), V3(0, Math.sin(t), Math.cos(t)), V3(0, Math.cos(t), -Math.sin(t)), 0.62 + 0.3 * rng(), 0.5 + 0.2 * rng(),
      { sp: i % 6 === 0 ? S.sycamore : i % 9 === 0 ? S.walnut : S.harewood, shape: 3, ga: rng() * 3.1, base: 0.12, amp: 0.3, rate: 2.4, phase: -z * 0.22 });
  }
}

// ---------------------------------------------------------------- the piazza: z 200-260, 90 m wide, the quay edge at 260
async function buildPiazza(W) {
  const { ctx, look, sun } = W, rng = W.rng.fork('piazza'), pb = W.style.builder(), in1 = W.style.builder(), in2 = W.style.builder(), Y = PAVE;
  // pavement: the street's chequer runs on down the middle; the fields either side are larger squares set in stringing
  for (let j = 0; j < 20; j++) for (let i = 0; i < 6; i++) {
    const x0 = -9 + i * 3, z0 = 201 + j * 3, dark = (i + j) % 2 === 0;
    if (z0 + 3 > 261) continue;
    pb.quad(V3(x0, Y, z0 + 3), V3(x0, Y, z0), V3(x0 + 3, Y, z0), V3(x0 + 3, Y, z0 + 3), { sp: dark ? S.walnut : S.holly, ang: dark ? 0 : 1.5708 });
  }
  for (const side of [1, -1]) for (let j = 0; j < 10; j++) for (let i = 0; i < 6; i++) {
    const x0 = side > 0 ? 9 + i * 6 : -15 - i * 6, z0 = 201 + j * 6, k = (i + j) % 2;
    pb.quad(V3(x0, Y, z0 + 6), V3(x0, Y, z0), V3(x0 + 6, Y, z0), V3(x0 + 6, Y, z0 + 6), { sp: k ? S.sycamore : S.oak, ang: k ? 0.785 : -0.785 });
    slab(in1, V3(x0 + 3, Y + 0.012, z0 + 3), V3(0.707, 0, 0.707), V3(-0.707, 0, 0.707), 1.5, 1.5, { sp: k ? S.pear : S.holly, ang: k ? 0 : 1.5708 });
    slab(in2, V3(x0 + 3, Y + 0.02, z0 + 3), AX, AZ, 0.5, 0.5, { sp: k ? S.ebony : S.walnut });
  }
  for (const side of [1, -1]) slab(in2, V3(side * 9, Y + 0.015, 231), AX, AZ, 0.18, 30, { sp: S.ebony, ang: 1.5708 });
  // the inlays of the side fields lie in the floor: drawn as two layers with a depth offset each, so their edges
  // stay clean at any range (two centimetres of height alone tore at 30-60 m)
  for (const [b, k] of [[in1, 1], [in2, 2]]) { const m = new THREE.Mesh(b.build(), W.style.pieceMaterial()); m.material.polygonOffset = true; m.material.polygonOffsetFactor = -1.5 * k; m.material.polygonOffsetUnits = -6 * k; W.scene.add(m); }
  await ctx.yield();
  // the octagonal temple, 30 m tall, to starboard
  const tc = V3(-40, Y, 243), R = 11.5;
  box(pb, tc.x, Y, tc.z, 27, 1.2, 27, { sp: S.sycamore, top: S.holly, sides: grade(V3(0, 0, 1), sun), ends: grade(V3(1, 0, 0), sun) });
  for (let k = 0; k < 8; k++) {
    const a0 = (k / 8) * 6.2832 + 0.3927, a1 = ((k + 1) / 8) * 6.2832 + 0.3927, am = (a0 + a1) / 2, n = V3(Math.cos(am), 0, Math.sin(am)), sp = grade(n, sun, 0), sp2 = grade(n, sun, 1);
    const p0 = V3(tc.x + R * Math.cos(a1), Y + 1.2, tc.z + R * Math.sin(a1)), p1 = V3(tc.x + R * Math.cos(a0), Y + 1.2, tc.z + R * Math.sin(a0)), u = p1.clone().sub(p0), fw = u.length(); u.normalize();
    panelGrid(pb, p0, u, AY, fw, 16, 4, 4, (i, j) => (i > 0 && i < 3 && j < 3 ? null : { sp: (i + j) % 2 ? sp : sp2, ang: (i + j) % 2 ? 0 : 1.5708 }));
    slab(pb, at(p0, u, fw / 2, AY, 6, n, 0), u, AY, fw / 4, 6, { sp: S.bogoak, scorch: 1, ang: 1.5708 });                               // the blind arch, a dark inlay
    annulus(pb, at(p0, u, fw / 2, AY, 12, n, 0.03), u, AY, fw / 4 - 0.7, fw / 4 + 0.5, 7, (q) => ({ sp: q % 2 ? S.holly : S.pear }), 0, Math.PI);
    slab(pb, at(p0, u, fw / 2, AY, 4.5, n, 0.03), u, AY, 1.3, 3.6, { sp: look.night ? S.holly : S.walnut, ang: 1.5708 });
    for (const e of [0, 1]) for (let q = 0; q < 3; q++) slab(pb, at(p0, u, e ? fw - 0.3 - q * 0.3 : 0.3 + q * 0.3, AY, 8, n, 0.08), u, AY, 0.15, 8, { sp: [S.holly, S.sycamore, S.oak][q] === sp ? S.pear : [S.holly, S.sycamore, S.oak][q], ang: 1.5708 });
    for (const [ya, yb, off, s2] of [[16, 16.6, 0.3, S.ebony], [16.6, 17.2, 0.5, S.holly], [17.2, 18.4, 0.2, S.rosewood]]) pb.quad(at(p0, u, -off * 0.4, AY, ya, n, off), at(p0, u, fw + off * 0.4, AY, ya, n, off), at(p0, u, fw + off * 0.4, AY, yb, n, off), at(p0, u, -off * 0.4, AY, yb, n, off), { sp: s2 });
    // the dome: eight gores, each three graded strips
    for (let g = 0; g < 3; g++) {
      const A = [], B = [], b0 = a1 + ((a0 - a1) * g) / 3, b1 = a1 + ((a0 - a1) * (g + 1)) / 3, nm = V3(Math.cos((b0 + b1) / 2), 0.6, Math.sin((b0 + b1) / 2)).normalize();
      for (let s = 0; s <= 5; s++) { const t = (s / 5) * 1.35, r = R * Math.cos(t) * 0.98, y = Y + 19.6 + R * 0.86 * Math.sin(t); A.push(V3(tc.x + r * Math.cos(b0), y, tc.z + r * Math.sin(b0))); B.push(V3(tc.x + r * Math.cos(b1), y, tc.z + r * Math.sin(b1))); }
      pb.strip(A, B, { sp: grade(nm, sun, g === 1) });
    }
  }
  turned(pb, tc.x, tc.z, [[28.9, 2.6], [29.6, 2.9], [30, 1.9], [33, 1.9], [33.4, 2.5], [34.6, 0.3]], 8, sun, 1, Y);
  floorShadow(pb, W, V3(tc.x - look.side * 2, 0, tc.z - 12), V3(tc.x - look.side * 2, 0, tc.z + 12), 13, Y + 0.03);
  await ctx.yield();
  // the campanile at the port corner, 46 m, seen over the palace roofs all the way down the street
  const cx = 37, cz = 207;
  for (let s = 0; s < 6; s++) for (const [n, u] of [[V3(0, 0, -1), V3(-1, 0, 0)], [V3(-1, 0, 0), V3(0, 0, 1)], [V3(0, 0, 1), V3(1, 0, 0)], [V3(1, 0, 0), V3(0, 0, -1)]]) {
    const o = V3(cx, Y + s * 6.5, cz).addScaledVector(n, 3.6).addScaledVector(u, -3.6), g1 = grade(n, sun, 1), g0 = grade(n, sun, 0);
    panelGrid(pb, o, u, AY, 7.2, 6, 3, 2, (i, j) => ({ sp: s === 5 && i === 1 ? S.bogoak : (i + j + s) % 2 ? g1 : g0, ang: (i + j) % 2 ? 0 : 1.5708 }));
    pb.quad(at(o, u, -0.3, AY, 6, n, 0.3), at(o, u, 7.5, AY, 6, n, 0.3), at(o, u, 7.5, AY, 6.5, n, 0.3), at(o, u, -0.3, AY, 6.5, n, 0.3), { sp: s % 2 ? S.ebony : S.holly });
    if (s === 5) { const A = V3(cx, Y + 46, cz); pb.quad(at(o, u, -0.5, AY, 6.5, n, 0.5), at(o, u, 7.7, AY, 6.5, n, 0.5), A.clone().addScaledVector(u, 0.1), A.clone().addScaledVector(u, -0.1), { sp: grade(n.clone().setY(0.5).normalize(), sun, 1), ang: 1.5708 }); }
  }
  for (const side of [1, -1]) {                       // the palaces that close the piazza's two sides, and the corner walls
    palace(W, pb, side, 201, 9, side > 0 ? 21 : 23, side > 0 ? 3 : 4, { fx: 45, sch: 2 });
    panelGrid(pb, V3(side > 0 ? 45 : -25, Y, 200.5), AX.clone().negate(), AY, 20, 20, 5, 4, (i, j) => ({ sp: (i + j) % 2 ? S.sycamore : S.oak, ang: (i + j) % 2 ? 0 : 1.5708 }));
    await ctx.yield();
  }
  // the wellhead
  turned(pb, -13, 219, [[0, 2.3], [0.5, 2.3], [0.7, 1.9], [2.2, 1.7], [2.5, 2.1], [2.8, 2.1]], 10, sun, 1, Y);
  annulus(pb, V3(-13, Y + 2.8, 219), AX, AZ, 1.3, 2.1, 10, (k) => ({ sp: k % 2 ? S.holly : S.pear })); slab(pb, V3(-13, Y + 2.3, 219), AX, AZ, 1.3, 1.3, { sp: S.ebony });
  floorShadow(pb, W, V3(-13 - look.side, 0, 217), V3(-13 - look.side, 0, 221), 2.8, Y + 0.03);
  // the quay: its face down to the sea and a row of turned bollards with their little shadows
  for (let i = -8; i < 8; i++) {
    const x0 = i * 6;
    for (const [ya, yb, sp] of [[Y - 0.35, Y, S.holly], [Y - 0.7, Y - 0.35, S.ebony], [-3, Y - 0.7, i % 2 ? S.walnut : S.rosewood]]) pb.quad(V3(x0, ya, 260.4), V3(x0 + 6, ya, 260.4), V3(x0 + 6, yb, 260.4), V3(x0, yb, 260.4), { sp, ang: 0 });
    pb.quad(V3(x0, Y, 260.4), V3(x0 + 6, Y, 260.4), V3(x0 + 6, Y, 259.4), V3(x0, Y, 259.4), { sp: i % 2 ? S.pear : S.oak });
    if (Math.abs(x0) > 7 && i % 2 === 0) { turned(pb, x0, 258.6, [[0, 0.55], [1.0, 0.45], [1.15, 0.75], [1.5, 0.6], [1.7, 0.1]], 8, sun, 1, Y); floorShadow(pb, W, V3(x0 - 0.4, 0, 258.3), V3(x0 + 0.4, 0, 258.9), 1.7, Y + 0.03); }
  }
  W.mesh(pb); await ctx.yield();
  buildPlinthPiece(W, V3(23, Y, 245));
}

// a hoop: a flat annulus plus its outer band, about centre c with unit axes u, v (plane) and w (the hoop's axis)
function hoop(pb, c, u, v, w, r, wid, thick, n, spA, spB) {
  annulus(pb, c, u, v, r - thick, r, n, (k) => ({ sp: k % 2 ? spA : spB, ang: 1.5708 }));
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * 6.2832, a1 = ((k + 1) / n) * 6.2832, P = (a, s) => at(c, u, r * Math.cos(a), v, r * Math.sin(a), w, s);
    pb.quad(P(a0, -wid / 2), P(a1, -wid / 2), P(a1, wid / 2), P(a0, wid / 2), { sp: k % 2 ? spB : spA });
  }
}
// what stands on the plinth in the piazza: the armillary sphere (rings turning at three rates), or a giant faceted
// ring, or an astrolabe
function buildPlinthPiece(W, base) {
  const { look, sun } = W, pb = W.style.builder(), Y = base.y, O = V3(0, 0, 0);
  turned(pb, base.x, base.z, [[0, 4.2], [0.8, 4.2], [1.1, 3.4], [4.6, 3.0], [5.0, 3.7], [5.6, 3.7], [6.0, 1.2], [7.0, 0.7]], 12, sun, 1, Y);
  floorShadow(pb, W, V3(base.x - look.side * 1.5, 0, base.z - 4), V3(base.x - look.side * 1.5, 0, base.z + 4), 9, Y + 0.03);
  slab(pb, V3(base.x - look.side * 9, Y + 0.035, base.z - 6.5 * (sun.z > 0 ? 1 : -1)), AX, AZ, 3.4, 3.4, { sp: S.bogoak, scorch: 1, ang: 0.785 });
  W.mesh(pb);
  const centre = V3(base.x, Y + 14.4, base.z), parts = [];
  const part = (fn, axis, rate, ph = 0) => { const b = W.style.builder(); fn(b); const m = new THREE.Mesh(b.build(), W.pieceMat); m.position.copy(centre); W.scene.add(m); parts.push({ m, axis: axis.clone().normalize(), rate, ph }); };
  if (look.plinth === 'armillary') {
    part((b) => { hoop(b, O, AZ, AY, AX, 7.4, 0.9, 0.7, 28, S.oak, S.pear); hoop(b, O, AX, AZ, AY, 7.3, 0.8, 0.6, 28, S.holly, S.ebony); }, AY, 0.16);
    const tl = 23.4 * DEG, ax = V3(Math.sin(tl), Math.cos(tl), 0), e1 = V3(Math.cos(tl), -Math.sin(tl), 0);
    part((b) => { hoop(b, O, e1, AZ, ax, 6.5, 1.5, 0.5, 24, S.boxwood, S.rosewood); for (const s of [-2.6, 2.6]) hoop(b, at(O, ax, s, AY, 0), e1, AZ, ax, 5.95, 0.45, 0.35, 20, S.sycamore, S.pear);
      b.block(new THREE.Matrix4().makeBasis(e1, ax, AZ), 0.35, 14.6, 0.35, { sp: S.ebony, sides: S.walnut }); }, ax, 0.42, 1);
    part((b) => { hoop(b, O, AX, AY, AZ, 5.2, 0.6, 0.45, 20, S.pear, S.holly); turned(b, 0, 0, [[-1.5, 0.1], [-1.1, 1.0], [-0.4, 1.45], [0.4, 1.45], [1.1, 1.0], [1.5, 0.1]], 10, sun, 1, 0); }, V3(0.3, 1, 0.2), -0.7, 2);
  } else if (look.plinth === 'ring') {
    part((b) => { const NS = 16, NF = 6, RM = 6, rm = 1.5, tp = (i, k) => { const a = (i / NS) * 6.2832, c = (k / NF) * 6.2832, r = RM + rm * Math.cos(c); return V3(r * Math.cos(a), r * Math.sin(a), rm * Math.sin(c)); };
      for (let i = 0; i < NS; i++) for (let k = 0; k < NF; k++) b.quad(tp(i, k), tp(i + 1, k), tp(i + 1, k + 1), tp(i, k + 1), { sp: (i + k) % 2 ? S.holly : (k < 3 ? S.pear : S.walnut), ang: (i + k) % 4 < 2 ? 0 : 1.5708 }); }, AY, 0.3);
  } else {
    part((b) => { annulus(b, O, AZ, AY, 6.2, 7.4, 36, (k) => ({ sp: k % 2 ? S.holly : S.ebony })); annulus(b, V3(0.05, 0, 0), AZ, AY, 0.4, 6.2, 12, (k) => ({ sp: k % 2 ? S.oak : S.sycamore, ang: 1.5708 })); hoop(b, O, AZ, AY, AX, 7.4, 0.5, 0.1, 24, S.pear, S.rosewood); }, AX, 0);
    part((b) => { for (const xo of [-0.12, 0.2]) { annulus(b, V3(xo, 2, 0), AZ, AY, 3.3, 3.8, 20, (k) => ({ sp: k % 2 ? S.pear : S.rosewood })); for (let k = 0; k < 7; k++) { const a = k * 0.9, r = 2.2 + (k % 3) * 1.5; slab(b, V3(xo, r * Math.sin(a), r * Math.cos(a)), V3(0, Math.sin(a), Math.cos(a)), V3(0, Math.cos(a), -Math.sin(a)), 1.1, 0.22, { sp: S.walnut }); } } }, AX, 0.35);
    part((b) => { for (const xo of [-0.25, 0.33]) slab(b, V3(xo, 0, 0), AY, AZ, 7.2, 0.4, { sp: S.ebony }); }, AX, -0.8, 1);
  }
  const q = new THREE.Quaternion();
  W.live.push((time) => { for (const p of parts) p.m.quaternion.setFromAxisAngle(p.axis, time * p.rate + p.ph); });
  W.plinthCentre = centre;
}

// ---------------------------------------------------------------- the harbour: mole, far quays, hills
// ---------------------------------------------------------------- the working quay: cranes, crates and barrels
// A harbour crane: a turned drum under a cap, a jib of two graded faces, a glue-dark rope and a framed crate turning
// on it (a hinged leaf). yaw: the way the jib points (radians from +X toward +Z).
function crane(W, pb, x, y0, z, yaw, hgt, rnd) {
  const sun = W.sun, dx = Math.cos(yaw), dz = Math.sin(yaw), reach = hgt * 0.85, tip = V3(x + dx * reach, y0 + hgt * 1.45, z + dz * reach), foot = V3(x, y0 + hgt * 0.62, z);
  turned(pb, x, z, [[0, hgt * 0.26], [hgt * 0.08, hgt * 0.26], [hgt * 0.1, hgt * 0.2], [hgt * 0.6, hgt * 0.18], [hgt * 0.63, hgt * 0.27], [hgt * 0.7, hgt * 0.27], [hgt * 0.95, 0.05]], 8, sun, 1, y0);
  const ax = tip.clone().sub(foot).normalize(), sd = V3(-dz, 0, dx), up = V3().crossVectors(sd, ax).normalize(), r = hgt * 0.035;
  for (const [n, e] of [[sd, up], [up, sd.clone().negate()], [sd.clone().negate(), up.clone().negate()], [up.clone().negate(), sd]]) {
    const a = foot.clone().addScaledVector(n, r), b = tip.clone().addScaledVector(n, r * 0.6);
    pb.quad(a.clone().addScaledVector(e, -r), b.clone().addScaledVector(e, -r * 0.6), b.clone().addScaledVector(e, r * 0.6), a.clone().addScaledVector(e, r), { sp: grade(n, sun, 1) });
  }
  // the stay from the cap to the jib, and the rope: thin ebony pieces (two crossed faces, never under a few pixels near)
  const cap = V3(x, y0 + hgt * 0.95, z), mid = foot.clone().lerp(tip, 0.7), drop = hgt * (0.55 + 0.25 * rnd), end = V3(tip.x, tip.y - drop, tip.z);
  for (const [p, q] of [[cap, mid], [tip, end]]) for (const e of [sd, V3(dx, 0, dz)]) pb.quad(p.clone().addScaledVector(e, -0.07), q.clone().addScaledVector(e, -0.07), q.clone().addScaledVector(e, 0.07), p.clone().addScaledVector(e, 0.07), { sp: S.ebony });
  const cw = hgt * 0.2;
  W.leaves.add(V3(end.x, end.y - cw * 0.5, end.z).addScaledVector(sd, -cw * 0.5), sd, AY, cw, cw, { sp: rnd < 0.5 ? S.walnut : S.pear, sp2: rnd < 0.5 ? S.oak : S.holly, shape: 0, ga: 0, base: 0, amp: 0.7, rate: 0.5 + 0.4 * rnd, phase: rnd * 6 });
  floorShadow(pb, W, V3(x - hgt * 0.2, 0, z - hgt * 0.2), V3(x + hgt * 0.2, 0, z + hgt * 0.2), hgt * 0.8, y0 + 0.03);
}
// a pile of cargo: crates (boxes of two woods, grain turned on alternate faces) and barrels (graded strips, ebony hoops)
function cargo(W, pb, x, y0, z, rng, n) {
  const sun = W.sun;
  for (let i = 0; i < n; i++) {
    const a = rng() * 6.28, d = 0.4 + 1.5 * Math.sqrt(i) * (0.7 + 0.5 * rng()), px = x + Math.cos(a) * d * 1.4, pz = z + Math.sin(a) * d * 0.8, s = 1.0 + 0.7 * rng();
    if (i % 3 === 2) { turned(pb, px, pz, [[0, s * 0.42], [s * 0.12, s * 0.5], [s * 0.6, s * 0.56], [s * 1.08, s * 0.5], [s * 1.2, s * 0.42], [s * 1.2, 0.02]], 8, sun, 1, y0); continue; }
    const sp = [S.oak, S.pear, S.walnut, S.sycamore][Math.floor(rng() * 4)], lid = sp === S.sycamore ? S.oak : S.sycamore;
    box(pb, px, y0, pz, s, s * 0.8, s * 1.1, { sp, top: lid, sides: grade(V3(0, 0, -1), sun, 1), ends: grade(V3(1, 0, 0), sun, 0), alt: i % 2 });
    if (rng() < 0.45) box(pb, px + 0.1, y0 + s * 0.8, pz, s * 0.7, s * 0.6, s * 0.8, { sp: lid, top: S.holly, sides: grade(V3(0, 0, -1), sun, 0), ends: grade(V3(1, 0, 0), sun, 1), alt: (i + 1) % 2 });
  }
  floorShadow(pb, W, V3(x - 1.2, 0, z - 0.8), V3(x + 1.2, 0, z + 0.8), 1.3, y0 + 0.03);
}

async function buildHarbour(W) {
  const { ctx, look, sun } = W, rng = W.rng.fork('harbour'), pb = W.style.builder();
  // the mole: 9 m wide, leaves the quay 150 m to port and curves in to the bastion under the course
  const mc = (t) => V3(11 + 139 * Math.cos(t * Math.PI / 2), 0, 262 + 283 * Math.sin(t * Math.PI / 2)), NM = 64, yT = 1.3;
  const rail = (off, y) => { const a = []; for (let i = 0; i <= NM; i++) { const p = mc(i / NM), q = mc(Math.min(1, i / NM + 0.004)).sub(mc(Math.max(0, i / NM - 0.004))).normalize(); a.push(V3(p.x + q.z * off, y, p.z - q.x * off)); } return a; };
  const R = [rail(-4.5, -2.5), rail(-4.5, 0.75), rail(-4.5, yT), rail(-3.6, yT), rail(3.6, yT), rail(4.5, yT), rail(4.5, 0.75), rail(4.5, -2.5)];
  for (let i = 0; i < NM; i++) {
    const seg = (a, b, o) => pb.quad(R[a][i], R[a][i + 1], R[b][i + 1], R[b][i], o);
    seg(0, 1, { sp: i % 2 ? S.walnut : S.rosewood }); seg(1, 2, { sp: i % 4 === 0 ? S.ebony : S.holly }); seg(2, 3, { sp: S.pear }); seg(3, 4, { sp: i % 2 ? S.oak : S.sycamore, ang: i % 2 ? 0.785 : -0.785 });
    seg(4, 5, { sp: S.pear }); seg(5, 6, { sp: i % 4 === 0 ? S.ebony : S.holly }); seg(6, 7, { sp: i % 2 ? S.bogoak : S.walnut });
    if (i % 6 === 3 && i < NM - 4) { const p = R[4][i]; turned(pb, p.x, p.z, [[0, 0.5], [1.1, 0.4], [1.3, 0.7], [1.7, 0.5], [1.9, 0.1]], 8, sun, 1, yT); }
  }
  // the mole is a working quay: five cranes with their jibs over the water on the course side, cargo between them
  const qr = W.rng.fork('quayside');
  for (let c = 0; c < 9; c++) { const t = 0.07 + c * 0.1, p = mc(t), q = mc(t + 0.004).sub(mc(t - 0.004)).normalize(), nx = q.z, nz = -q.x;      // (nx, nz): toward the far side of the mole
    if (c % 2 === 0) crane(W, pb, p.x + nx * 1.4, yT, p.z + nz * 1.4, Math.atan2(-nz, -nx) + (qr() - 0.5) * 0.7, 6.5 + 2.5 * qr(), qr());
    else cargo(W, pb, p.x + nx * 0.8, yT, p.z + nz * 0.8, qr, 5 + Math.floor(qr() * 4)); }
  // and the city quay either side of the piazza: a crane and cargo at each end of the bollard row, more along the far quays
  for (const sd of [1, -1]) { const cxq = sd > 0 ? 40 : -20; crane(W, pb, cxq, PAVE, 256.3, Math.PI / 2 - sd * 0.35, 8, qr()); cargo(W, pb, cxq + sd * 4.5, PAVE, 255.6, qr, 6); cargo(W, pb, sd * 15.5, PAVE, 256.8, qr, 3);
    for (let k = 0; k < 5; k++) { const x0 = sd * (70 + k * 36 + qr() * 8); if (k % 2 === 0) crane(W, pb, x0, PAVE, 258, Math.PI / 2 + (qr() - 0.5) * 0.6, 8 + 3 * qr(), qr()); cargo(W, pb, x0 + 8, PAVE, 257, qr, 6 + Math.floor(qr() * 4)); } }
  await ctx.yield();
  const bp = mc(0.52); turned(pb, bp.x + 9, bp.z + 4, [[-2.5, 5], [1.3, 5], [1.6, 3.2], [11, 2.2], [11.6, 3.1], [12.4, 3.1], [13, 1.6], [16, 1.4], [17.5, 0.2]], 10, sun, 1, 0);      // the beacon
  await ctx.yield();
  // the far quays either side of the piazza: plain pale blocks, larger pieces, fewer joints
  for (const side of [1, -1]) for (let k = 0; k < 7; k++) {
    const x0 = side * (64 + k * 34 + rng() * 6), h = 15 + rng() * 12, w = 24 + rng() * 6, z = 232 - rng() * 14;
    box(pb, x0, PAVE, z, w, h, 30, { sp: S.sycamore, top: S.pear, sides: grade(V3(0, 0, 1), sun, k % 2), ends: grade(V3(-side, 0, 0), sun, 0), ang: 1.5708 });
    for (let b = 0; b < 3; b++) slab(pb, V3(x0 - w / 2 + (b + 0.5) * w / 3, PAVE + h * 0.55, z + 15.04), AX, AY, 1.6, h * 0.18, { sp: look.night ? S.holly : S.walnut, ang: 1.5708 });
    slab(pb, V3(x0, PAVE + 0.01, 254), AX, AZ, 17.5, 9, { sp: k % 2 ? S.oak : S.sycamore, ang: k % 2 ? 0 : 1.5708 });
    for (const [ya, yb, sp] of [[PAVE - 0.5, PAVE, S.holly], [-3, PAVE - 0.5, k % 2 ? S.walnut : S.rosewood]]) pb.quad(V3(x0 - 17.5, ya, 263), V3(x0 + 17.5, ya, 263), V3(x0 + 17.5, yb, 263), V3(x0 - 17.5, yb, 263), { sp });
    pb.quad(V3(x0 - 17.5, PAVE, 263), V3(x0 + 17.5, PAVE, 263), V3(x0 + 17.5, PAVE, 245), V3(x0 - 17.5, PAVE, 245), { sp: k % 2 ? S.sycamore : S.oak });
  }
  await ctx.yield();
  // the hills beyond the runners: four big plain pieces, one walled road sawn into the nearest
  for (const side of [1, -1]) for (let layer = 0; layer < 2; layer++) {
    const x = side * (640 + layer * 120), A = [], B = [], n = 9, z0 = -300, z1 = 1500, ph = rng() * 6;
    for (let i = 0; i <= n; i++) { const z = z0 + ((z1 - z0) * i) / n, h = (layer ? 150 : 85) * (0.55 + 0.45 * Math.sin(i * 1.1 + ph) * Math.sin(i * 0.47 + ph * 2) + 0.25 * Math.sin(i * 2.3 + ph)); A.push(V3(x, -10, z)); B.push(V3(x - side * 20, Math.max(18, h), z)); }
    side > 0 ? pb.strip(A, B, { sp: layer ? S.harewood : S.sycamore, ang: 0.08 }) : pb.strip(B, A, { sp: layer ? S.harewood : S.sycamore, ang: 0.08 });
    if (!layer && side === 1) for (let i = 0; i < 6; i++) { const za = 200 + i * 90, ya = 12 + i * 7, zb = za + 90, yb = ya + 7 * (i % 2 ? -0.6 : 1.9);
      pb.quad(V3(x - 8, ya, za), V3(x - 8, yb, zb), V3(x - 8, yb + 3.2, zb), V3(x - 8, ya + 3.2, za), { sp: S.holly }); }
  }
  W.mesh(pb).frustumCulled = false;
  await ctx.yield();
  buildLight(W);
  await ctx.yield();
}
// THE BREAKWATER LIGHT: a turned lighthouse 32 m tall on its own round drum, 27 m off the course at z 424, on the side away from the sun,
// with a stub of breakwater running off to port behind it. Passed close on the left between u 0.68 and 0.78 (the
// caravel has just gone by on the right). Storeys of graded strips in alternate warm and pale woods, ebony strings,
// a gallery, an open lantern in which a holly mirror swings, a pear roof and a turned finial with a vane.
const LIGHT = { x: 27, z: 424, top: 1.9 };      // x: on the side away from the sun (-27 * look.side)
function buildLight(W) {
  const { sun } = W, sd0 = -W.look.side, lt = W.style.builder(), LX = LIGHT.x * sd0, LZ = LIGHT.z, dT = LIGHT.top, NF = 12, DR = 8.5, ND = 20;
  const band = (ya, yb, ra, rb, fn, n = NF) => { for (let k = 0; k < n; k++) { const a0 = (k / n) * 6.2832, a1 = ((k + 1) / n) * 6.2832;
    lt.quad(V3(LX + ra * Math.cos(a0), ya, LZ + ra * Math.sin(a0)), V3(LX + ra * Math.cos(a1), ya, LZ + ra * Math.sin(a1)), V3(LX + rb * Math.cos(a1), yb, LZ + rb * Math.sin(a1)), V3(LX + rb * Math.cos(a0), yb, LZ + rb * Math.sin(a0)), fn(k, V3(Math.cos((a0 + a1) / 2), 0.1, Math.sin((a0 + a1) / 2)).normalize())); } };
  // the drum: graded strips round it, an ebony and holly string, a parquet fan on top
  band(-2.5, 0.5, DR, DR, (k, n) => ({ sp: grade(n, sun, 1), ang: 1.5708 }), ND); band(0.5, 0.9, DR, DR, () => ({ sp: S.ebony }), ND);
  band(0.9, dT - 0.3, DR, DR, (k, n) => ({ sp: grade(n, sun, 0), ang: 1.5708 }), ND); band(dT - 0.3, dT, DR, DR, () => ({ sp: S.holly }), ND);
  band(dT, dT, DR, 6.1, (k) => ({ sp: k % 2 ? S.oak : S.pear }), ND); band(dT, dT, 6.1, 5.6, () => ({ sp: S.ebony }), ND); band(dT, dT, 5.6, 0.2, (k) => ({ sp: k % 2 ? S.holly : S.walnut, ang: 1.5708 }), ND);
  // the tower
  const Y = (y) => dT + y, stor = [[0, 4.5, 1.3, 4.5, 1], [1.3, 4.5, 1.8, 3.75, 1], [1.8, 3.75, 7, 3.4, 1], [7.4, 3.4, 12.6, 3.0, 0], [13, 3.0, 18, 2.65, 1]];
  // (storeys in two cuts, so the stripes read from the shaded side too: a pale one graded holly to pear, a dark one oak to bog oak)
  const cutA = [S.holly, S.sycamore, S.sycamore, S.oak, S.pear], cutB = [S.oak, S.pear, S.walnut, S.rosewood, S.bogoak], gi = (n) => { const dd = n.dot(sun); return dd > 0.6 ? 0 : dd > 0.28 ? 1 : dd > 0 ? 2 : dd > -0.32 ? 3 : 4; };
  for (const [ya, ra, yb, rb, warm] of stor) band(Y(ya), Y(yb), ra, rb, (k, n) => ({ sp: (warm ? cutB : cutA)[gi(n)], ang: 1.5708 }));
  for (const [ya, yb, r] of [[7, 7.4, 3.45], [12.6, 13, 3.05]]) band(Y(ya), Y(yb), r, r, (k) => ({ sp: k % 2 ? S.ebony : S.holly }));
  for (let k = 0; k < NF; k += 3) { const a = ((k + 0.5) / NF) * 6.2832 + 3.4, c = Math.cos(a), sn = Math.sin(a);                  // slit windows: bog oak let in
    for (const [y, r] of [[4.4, 3.62], [10, 3.24], [15.5, 2.86]]) slab(lt, V3(LX + r * c, Y(y), LZ + r * sn), V3(-sn, 0, c), AY, 0.34, 0.95, { sp: S.bogoak, scorch: 1, ang: 1.5708 }); }
  band(Y(18), Y(18.6), 2.65, 4.1, (k, n) => ({ sp: k % 2 ? S.walnut : S.rosewood })); band(Y(18.6), Y(19.4), 4.1, 4.1, (k) => ({ sp: k % 2 ? S.holly : S.ebony })); band(Y(19.4), Y(19.4), 4.1, 0.2, () => ({ sp: S.oak }));
  for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.2832 + 0.3; lt.block(new THREE.Matrix4().makeRotationY(-a).setPosition(LX + 2.3 * Math.cos(a), Y(21.5), LZ + 2.3 * Math.sin(a)), 0.4, 4.2, 0.5, { sp: S.walnut, sides: grade(V3(Math.cos(a), 0, Math.sin(a)), sun, 1), ends: S.ebony }); }
  band(Y(23.6), Y(24.1), 3.2, 3.2, (k) => ({ sp: k % 2 ? S.ebony : S.holly })); band(Y(24.1), Y(27.4), 3.2, 0.5, (k, n) => ({ sp: grade(n, sun, 1) === S.holly ? S.oak : grade(n, sun, 1), ang: 1.5708 }));
  for (const [ya, ra, yb, rb] of [[27.4, 0.5, 28.1, 1.05], [28.1, 1.05, 28.8, 0.4], [28.8, 0.4, 29.7, 0.8], [29.7, 0.8, 30.5, 0.1]]) band(Y(ya), Y(yb), ra, rb, (k, n) => ({ sp: grade(n, sun, 0) }), 8);
  W.leaves.add(V3(LX, Y(21.5), LZ), AX, AY, 1.85, 2.6, { sp: S.holly, shape: 4, ga: 1.5708, base: 0.8, amp: 1.45, rate: 0.9, phase: 1 });           // the lamp's holly mirror, swinging
  W.leaves.add(V3(LX, Y(31.3), LZ), AX, AY, 2.6, 1.0, { sp: S.pear, sp2: S.holly, shape: 0, ga: 0, base: 2.5, amp: 0.45, rate: 0.8, phase: 2 });      // the vane
  slab(lt, V3(LX, Y(30.9), LZ), AX, AY, 0.07, 0.9, { sp: S.ebony }); slab(lt, V3(LX, Y(30.9), LZ), AZ, AY, 0.07, 0.9, { sp: S.ebony });
  floorShadow(lt, W, V3(LX - 3.2, 0, LZ - 3.2), V3(LX + 3.2, 0, LZ + 3.2), 2.6, dT + 0.03);
  // the stub of breakwater: seven pieces of quay running off to port, bollards, a pile of cargo
  const d = V3(0.906 * sd0, 0, 0.423), nr = V3(-0.423, 0, 0.906 * sd0), A0 = V3(LX + 7.2 * sd0, 0, LZ + 3.4), NB = 7, SL = 6.4, hwB = 2.7, yB = 1.4;
  const Pb = (i, off, y) => V3(A0.x + d.x * i * SL + nr.x * off, y, A0.z + d.z * i * SL + nr.z * off);
  for (let i = 0; i < NB; i++) {
    lt.quad(Pb(i, -hwB, yB), Pb(i + 1, -hwB, yB), Pb(i + 1, hwB, yB), Pb(i, hwB, yB), { sp: i % 2 ? S.oak : S.sycamore, ang: i % 2 ? 0.785 : -0.785 });
    for (const sd of [-1, 1]) { lt.quad(Pb(i, sd * hwB, -2.5), Pb(i + 1, sd * hwB, -2.5), Pb(i + 1, sd * hwB, yB - 0.5), Pb(i, sd * hwB, yB - 0.5), { sp: sd < 0 ? (i % 2 ? S.walnut : S.rosewood) : (i % 2 ? S.bogoak : S.walnut) });
      lt.quad(Pb(i, sd * hwB, yB - 0.5), Pb(i + 1, sd * hwB, yB - 0.5), Pb(i + 1, sd * hwB, yB), Pb(i, sd * hwB, yB), { sp: i % 3 === 0 ? S.ebony : S.holly }); }
    if (i % 2 === 1) { const b = Pb(i + 0.5, -1.7, 0); turned(lt, b.x, b.z, [[0, 0.5], [1.1, 0.4], [1.3, 0.7], [1.7, 0.5], [1.9, 0.1]], 8, sun, 1, yB); }
  }
  lt.quad(Pb(NB, -hwB, -2.5), Pb(NB, hwB, -2.5), Pb(NB, hwB, yB), Pb(NB, -hwB, yB), { sp: S.pear, ang: 1.5708 });
  const cg = Pb(4.6, 0.6, 0); cargo(W, lt, cg.x, yB, cg.z, W.rng.fork('light-cargo'), 5);
  W.mesh(lt).frustumCulled = false;
  W.light = { x: LX, z: LZ, top: Y(22), a: A0, b: Pb(NB, 0, 0) };
}

// ---------------------------------------------------------------- the fleet on the flat sea (the hero carries four more up the curve)
async function buildFleet(W) {
  const { look, hero } = W, rng = W.rng.fork('fleet'), ships = [], carrack = look.ships === 'carrack', galley = look.ships === 'galleys';
  const fleetBase = [], gv = hero.sea.uGroove.value, sp = look.weather === 'calm' ? 0.35 : look.weather === 'blow' ? 1.25 : 1;
  const mk = (x, scale, o) => {
    const g = new THREE.Group(), m = hero.makeCaravel(); m.rotation.y = -Math.PI / 2; m.scale.set(scale, scale, -scale * look.side); g.add(m); m.frustumCulled = false; W.scene.add(g);
    if (galley) {                              // oars: hinged slats, a bank each side, rowing together
      const os = new LeafSet();
      for (const e of [-1, 1]) for (let i = 0; i < 9; i++) os.add(V3(-9 + i * 2.1, 2.3, e * 3.4), V3(0.15, -0.42, e).normalize(), AX, 7.5, 0.5, { sp: i % 2 ? S.pear : S.oak, sp2: S.holly, shape: 0, ga: 0, base: 0, amp: 0.42, rate: 2.1, phase: e > 0 ? 0 : 0 });
      m.add(os.build(W.leafMat));
    }
    const s = { g, x, scale, run: Math.abs(x) < 110 ? 150 : FLEET_RUN, ...o }; ships.push(s); return s;      // ships in the middle groove go down into their slot short of the mole and the bastion (z 460), so the ring stands clear
  };
  // the centre-port groove keeps 95 m off the course (a ship abeam there is whole in the frame or out of it), so nothing of the fleet ever stands between the lens and the ring
  gv[3] = Math.max(gv[3], 95);
  // the lead: far enough ahead and aside that she is whole in the frame while we come up on her, abeam at about u 0.8
  const lead = mk((carrack ? 44 : 36) * look.side, carrack ? 2.1 : 1.9, { lead: true }); gv[2] = lead.x;      // 57 m (the carrack 63 m) of hull: a third of the frame wide when she is 60 m ahead
  if (hero.sea.uGrooveEnd) hero.sea.uGrooveEnd.value[2] = 214;      // her slot is stopped short of the bastion
  // the harbour is busy: two ships to a groove (a 45 m one and a smaller one half a run behind her), all level on
  // the sheet, each with her own inlaid shadow (slots 3-11)
  lead.slot = 3;
  const nMore = carrack ? 4 : Math.min(8, Math.round(8 * look.density));
  for (let i = 0; i < nMore; i++) {
    const gi = [3, 1, 4, 0, 5][i % 5], first = i < 5, b = first ? [rng() * 600, (10 + 3 * rng()) * sp] : fleetBase[i - 5];
    if (first) fleetBase.push(b);
    mk(gv[gi], carrack ? 0.7 + 0.2 * rng() : first ? (i < 3 ? 1.5 : 1.15) : 0.8 + 0.35 * rng(), { off: first ? b[0] : b[0] + FLEET_RUN * (0.42 + 0.16 * rng()), v: b[1], slot: 4 + i });
  }
  W.ships = ships;
  // the lead's z: live's own law of the clock and the eye's z, as one function, so that the gaze works it out for the place it is
  // asked about (round 9: the look read the z that update() had written for the place before, and its first frame at a place was stale)
  W.leadZ = (time, camZ) => { const cz = Math.max(camZ, 230) - 332; return (carrack ? 394 + 0.1 * cz : 388 + 0.1 * cz) + 2 * sp * Math.sin(time * 0.21); };
  W.updateFleet = (time, camZ) => {
    for (const s of ships) {
      // a ship stands in her slot like the flat of a toy theatre: she comes up out of the sheet sails first as she
      // leaves the quay and goes down into it again at the end of her run, upright all the way (never laid over)
      const run = s.run || FLEET_RUN, tr = s.lead ? 100 : (s.off + s.v * time) % run, up = Math.min(smooth(0, 36, tr), 1 - smooth(run - 42, run, tr));
      const z = s.lead ? W.leadZ(time, camZ) : 310 + tr;      // 55 m ahead at u 0.61 (whole in the frame, the gaze turned a little to her), her stern abeam at u 0.65, out of the frame by u 0.70, never nearer the ring than 130 m
      const zc = z - QUAY_Z, h = hero.seaHeight(s.x, zc, time), h2 = hero.seaHeight(s.x, zc + 6 * s.scale, time);
      s.g.position.set(s.x, h * 0.8 - (1 - up) * 31 * s.scale, z); s.g.rotation.x = -Math.atan2(h2 - h, 6 * s.scale) * 0.6; s.g.rotation.z = 0.035 * Math.sin(time * 0.7 + s.x);
      s.z = z; s.up = up;
      // her inlaid shadow, about her own height; never laid across the course under the lens
      if (s.slot !== undefined) hero.setSeaShadow(s.x, zc, Math.min(20 * s.scale, Math.sign(s.x) === look.side ? Math.max(4, Math.abs(s.x) - (s.lead ? 13 : 6)) : 1e3) * up, 15 * s.scale, s.slot);
    }
  };
}

// ---------------------------------------------------------------- birds: two book-matched leaves hinged on a spine
async function buildBirds(W) {
  const { look, path } = W, rng = W.rng.fork('birds'), set = new LeafSet(), birds = [];
  const pig = look.birds === 'pigeons', nSw = Math.round(120 * Math.min(1, look.density) * (look.detail < 1 ? 0.8 : 1) / 6) * 6, nMid = 20, nPg = nMid + Math.round(12 * Math.min(1.15, look.density)), nGl = Math.round(18 * look.density);
  // counter: the two leaves are book-matched in counterchange: one wing all of the dark wood, the other all of the pale
  const wing = (sp, sp2, w, h, rate, amp, counter, fat = 0) => { for (const mirror of [false, true]) set.add(V3(0, -50, 0), AX, AZ, w, h, { sp: counter ? (mirror ? sp2 : sp) : sp, sp2: counter ? (mirror ? sp2 : sp) : sp2, shape: 2 + 0.4 * fat, ga: 0.5, base: 0.12, amp, rate, phase: birds.length * 1.7, mirror }); };
  // swallows in sixes. Sixes 0 and 1 escort the lens down the street (one low and close ahead, so we look down on
  // their backs; one higher in the slot of sky); the rest wheel across the street from arcade to arcade at stations
  // 16 m apart, banked into the turn, so the lens flies under or over each wheel and a leaf is never met edge-on for long.
  for (let i = 0; i < nSw; i++) { const six = Math.floor(i / 6), k = i % 6; if (pig) wing(S.harewood, S.holly, 1.3, 1.7, 16, 0.75, true, 0.8); else wing(S.walnut, S.holly, 1.35, 1.8, 25.1, 0.8, true);
    const sg = six % 2 ? 1 : -1;
    if (k === 0) { birds.six = { om: sg * (1.05 + 0.4 * rng()), rad: 5.8 + 1.5 * rng(), dy: sg * (2 + 2.2 * rng()) + 0.8, cx: (rng() - 0.5) * 2, ph: rng() * 6.28 }; if (Math.abs(44 + ((six - 2) % 15) * 16.5 - 111) < 14) birds.six.dy = Math.min(birds.six.dy, 1); }      // the wheel by the arch keeps under it
    birds.push({ kind: 0, six, k, ...birds.six, zs: 44 + ((six - 2) % 15) * 16.5 + (six >= 17 ? 8 : 0), r: rng(), w: pig ? 1.3 : 1.35, h: pig ? 1.7 : 1.8 }); }
  // (round 12, a cure by place) a wheel whose ring (its radius, its bob, a bird's reach) comes within 2 m of the route's
  // line is moved whole, once, here at the build, and keeps its own side of the line: an over wheel rises until its
  // lowest skin rides 2 m over the line's highest point beneath the ring, an under wheel sinks until its highest skin
  // rides 2 m under the line's lowest. An under wheel that would then lie on its floor for more than a tenth of its
  // round rises over the line instead; the wheel by the arch cannot rise, and is not laid (its birds keep their draws
  // and their slots and have no size). It reads the route's line and the wheel's own deal and nothing else; a wheel
  // that has its 2 m is left as dealt.
  { const q = new THREE.Vector3(), AIR = 2.05, BOB = 1.6, moved = {};
    for (const b of birds) { if (b.kind !== 0 || b.six < 2) continue;
      if (!(b.six in moved)) { const reach = Math.hypot(b.w, b.h / 2), R = b.rad, ext = 1.5 * R + reach, line = [];
        let lo = 1e9, hi = -1e9, near = 1e9;
        for (let z = b.zs - ext - 8; z <= b.zs + ext + 8; z += 0.25) { path.pointAt(clamp01(z / RING_Z), q); line.push(q.x, q.y, q.z); if (Math.abs(q.z - b.zs) <= ext) { lo = Math.min(lo, q.y); hi = Math.max(hi, q.y); } }
        path.pointAt(clamp01(b.zs / RING_Z), q);
        for (let j = 0; j < 240; j++) { const th = j / 240 * 6.2832, x = b.cx + R * Math.sin(th), y = Math.max(PAVE + BOB, q.y + b.dy + BOB * Math.sin(th + b.ph)), z = b.zs + 1.5 * R * Math.cos(th);
          for (let i = 0; i < line.length; i += 3) near = Math.min(near, Math.hypot(x - line[i], y - line[i + 1], z - line[i + 2])); }
        const dn = lo - q.y - AIR - BOB - reach, flat = 0.5 + Math.asin(Math.max(-1, Math.min(1, (PAVE + BOB - q.y - dn) / BOB))) / Math.PI;      // (flat: the share of its round the sunk wheel would lie on the floor)
        moved[b.six] = near - reach >= AIR ? b.dy : b.dy < 0 && flat <= 0.1 ? dn : Math.abs(44 + ((b.six - 2) % 15) * 16.5 - 111) < 14 ? null : hi - q.y + AIR + BOB + reach;
        await W.ctx.yield(); }      // (a wheel's measure is some 37,000 distances: the build may hand back after each wheel, so the wheels, eighteen at most, are not one long step)
      if (moved[b.six] === null) b.w = b.h = 0; else b.dy = moved[b.six]; } }
  for (let i = 0; i < nPg; i++) { wing(S.holly, S.walnut, 1.6, 1.7, 17, 0, false, 1);
    // twenty lie in the walnut squares of the centre chequer whatever the density (rows 3 m apart from z 217 to the
    // quay, two to a row, each with its own lead of 11-20 m), so from the moment the sea is revealed eight or more are
    // in the air in the middle of the frame, two or three still on edge in their squares; the rest lie in the side fields
    const mid = i < nMid, k = mid ? i : i - nMid, sd = k % 2 ? 1 : -1, r0 = rng(), r1 = rng();
    let x = sd * (9.5 + r0 * 6), z = 214 + 45 * (k + 0.5 * r1) / Math.max(1, nPg - nMid), lead = 10 + 9 * rng();
    if (mid) { const j = 5 + Math.floor(k * 0.7), odd = j % 2 === 1; z = 202.5 + 3 * j; x = sd > 0 ? (odd ? 1.5 : 4.5) : (odd ? -4.5 : -1.5); lead = 11 + 9 * r0; }
    birds.push({ kind: 1, x, z, head: rng() * 6.28, sd, r: rng(), lead, out: mid ? 0.3 : 1, w: 1.6, h: 1.7 }); }
  for (let i = 0; i < nGl; i++) { wing(S.holly, S.harewood, 2.4, 2.0, 9, 0.55, false, 0.4);
    birds.push({ kind: 2, c: i < 5 ? V3(W.light.x + (rng() - 0.5) * 5, LIGHT.top + 15 + 3.4 * i + rng() * 2, LIGHT.z + (rng() - 0.5) * 5) : V3((i % 2 ? 1 : -1) * (12 + rng() * 14), 5 + rng() * 9, 275 + rng() * 250), rad: i < 5 ? 8 + rng() * 5 : 5 + rng() * 4, sp: (0.25 + 0.2 * rng()) * (i % 3 ? 1 : -1), r: rng(), w: 2.4, h: 2.0 }); }
  for (let i = 0; i < 4; i++) { wing(S.holly, S.harewood, 1.7, 1.6, 7.5, 0.5, false, 0.4);
    birds.push({ kind: 3, d: [9.5, 12.5, 16, 21][i], x: [-4.2, 5.2, -8, 7.5][i], y: [1.5, 1.3, 1.9, 1.6][i], sd: i % 2 ? 1 : -1, r: 0.2 + 0.2 * i, w: 1.7, h: 1.6 }); }
  const mesh = set.build(W.leafMat); W.scene.add(mesh);
  const p = new THREE.Vector3(), f = new THREE.Vector3(), rt = new THREE.Vector3(), dn = new THREE.Vector3(), cp = new THREE.Vector3(), r2 = new THREE.Vector3(), d2 = new THREE.Vector3(), acc = new THREE.Vector3();
  // a wheel's station on the route never moves: the height of the route's line there is read once, here (doubles, by the bird's number)
  const lineY = new Float64Array(birds.length); for (let i = 0; i < birds.length; i++) { const b = birds[i]; if (b.kind === 0 && b.six >= 2) lineY[i] = path.pointAt(clamp01(b.zs / RING_Z), cp).y; }
  W.updateBirds = (time, u, camZ, cam) => {
    for (let i = 0; i < birds.length; i++) {
      const b = birds[i]; let roll = 0, flapOff = 0;
      let banked = false, size = 1;
      if (b.kind === 0) {
        const om = b.six < 2 ? (b.six ? -1.25 : 1.45) : b.om, th = time * om + b.ph - b.k * (b.six < 2 ? 0.62 : 0.42) * Math.sign(om), c = Math.cos(th), sn = Math.sin(th);
        if (b.six < 2) {                               // the escorts: a loose line astern, weaving and porpoising ahead of the lens
          const hi = b.six === 1, away = smooth(0.27, 0.36, u), aside = smooth(0.31, 0.38, u);      // they leave before the piazza: on ahead over the quay, then out to the sides, so the rolled sea is seen whole
          const cz = camZ + (hi ? 36 : 13.5) + 12 * (1 - smooth(0.02, 0.1, u)) + 75 * away + 2.5 * Math.sin(time * 0.4 + b.six * 2);
          path.pointAt(clamp01(cz / RING_Z), cp);
          const rx = hi ? 5.6 : 4.3, rz = hi ? 4.5 : 2.6, ry = hi ? 1.4 : 1.7, y0 = (hi ? cp.y + 6.5 - 2.6 * (1 - smooth(5, 18, Math.abs(cz - 111))) : Math.max(PAVE + 3.2, cam.y - 4.4)) + 5 * aside;
          p.set(rx * sn + (hi ? -1 : 1) * 34 * aside, y0 - ry * c, cz + rz * c + b.k * 1.1);
          f.set(rx * om * c, 2.2 * ry * om * sn, 13 - rz * om * sn).normalize(); acc.set(-rx * om * om * sn, 0, -rz * om * om * c);
        } else {                                       // the wheels: an ellipse across the street, tilted, the lens flies under or over it
          const R = b.rad;
          p.set(b.cx + R * sn, Math.max(PAVE + 1.6, lineY[i] + b.dy + 1.6 * Math.sin(th + b.ph)), b.zs + 1.5 * R * c);
          f.set(R * om * c, 1.6 * om * Math.cos(th + b.ph), -1.5 * R * om * sn).normalize(); acc.set(-R * om * om * sn, 0, -1.5 * R * om * om * c);
        }
        banked = true;
        { const ddz = Math.abs(p.z - cam.z), keep = 5.5 * (1 - smooth(8, 15, ddz)), dx = p.x - cam.x, dy = p.y - cam.y, dd = Math.hypot(dx, dy);
          if (dd < keep) { const kx = dd > 0.05 ? dx / dd : (i % 2 ? 1 : -1) * 0.8, ky = dd > 0.05 ? dy / dd : 0.6; p.x = cam.x + kx * keep; p.y = Math.max(PAVE + 1.2, cam.y + ky * keep); } }
      } else if (b.kind === 1) {                       // pigeons: flat holly inlays in the pavement that flip up on edge and away
        const t = (camZ - (b.z - b.lead)) / 14, lie = PAVE + 0.04 + 0.1 * smooth(8, 30, b.z - camZ);      // (far off she lies a hand proud, so her edge never tears against the floor)
        if (t <= 0) { p.set(b.x, lie, b.z); f.set(Math.sin(b.head), 0, Math.cos(b.head)); flapOff = -0.12; size = 1 - smooth(24, 34, b.z - camZ); }      // too far to show a clean cut outline: not shown
        else {
          // up on edge out of her square (0.4 s), then away: climbing steeply ahead of the lens with her back to it, so
          // the whole cut-out bird is seen, drifting out to her own side
          const k = Math.min(1, t * 2.6), fl = Math.max(0, t - 0.3), e = fl * fl, cl = smooth(0.25, 0.6, t);
          p.set(b.x + b.sd * b.out * (fl * 3 + e * 5), lie + k * 0.9 + fl * 4.4 + e * 3.4, b.z + fl * 11 + e * 12);
          f.set(Math.sin(b.head) * (1 - k) + b.sd * 0.3 * k, 0.2 * k + 0.75 * cl, Math.cos(b.head) * (1 - k) + k * (1 - 0.3 * cl)).normalize();
          roll = (1 - smooth(0.3, 0.62, t)) * k * 1.45 + 0.35 * b.sd * smooth(0.4, 0.8, t); flapOff = -0.12 + smooth(0.28, 0.45, t) * (0.12 + 0.85 * Math.sin(time * 17 + i));
        }
      } else if (b.kind === 3) {                       // the skimmers: in from the sides as we leave the quay, a loose line ahead and below the lens, away to the sides before the mole
        const inn = 1 - smooth(0.445, 0.53, u), out = smooth(0.77, 0.87, u), wv = Math.sin(time * 0.37 + b.r * 9), zz = camZ + b.d + 2 * Math.sin(time * 0.5 + b.r * 7) + 18 * out - 14 * inn;
        p.set(b.x + 2.2 * wv + b.sd * (46 * inn + 60 * out), W.hero.seaHeight(b.x, zz - QUAY_Z, time) + b.y + 0.5 * Math.sin(time * 0.9 + b.r * 5) + 7 * out, zz);
        // (they hang on the air as gulls do behind a boat: body pitched up 35 degrees, so from behind and above the whole cut-out bird is seen)
        f.set(0.25 * Math.cos(time * 0.37 + b.r * 9) - b.sd * 0.7 * ((inn > 0.02 && inn < 0.98 ? 1 : 0) - (out > 0.02 && out < 0.98 ? 1 : 0)), 0.62 + 0.12 * Math.sin(time * 0.6 + b.r * 4), 0.78).normalize(); roll = 0.3 * wv;
        size = camZ > 255 ? 1 : 0.001;
      } else {                                         // gulls wheeling over the quay
        const a = time * b.sp + b.r * 6.28; p.set(b.c.x + b.rad * Math.cos(a), b.c.y + 1.5 * Math.sin(a * 0.7 + b.r * 9), b.c.z + b.rad * Math.sin(a));
        f.set(-Math.sin(a) * Math.sign(b.sp), 0.05 * Math.cos(a * 0.7), Math.cos(a) * Math.sign(b.sp)).normalize(); roll = -0.8 * Math.sign(b.sp);
        { const keep = 9 * (1 - smooth(10, 18, Math.abs(p.z - cam.z))), dx = p.x - cam.x, dy = p.y - cam.y, dd = Math.hypot(dx, dy); if (dd < keep) { p.x = cam.x + (dd > 0.05 ? dx / dd : 0.8) * keep; p.y = Math.max(2, cam.y + (dd > 0.05 ? dy / dd : 0.6) * keep); } }
      }
      rt.set(f.z, 0, -f.x); if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0); rt.normalize(); dn.crossVectors(f, rt).normalize(); if (dn.y > 0) dn.negate();
      if (banked) roll = Math.max(-1.25, Math.min(1.25, 1.5 * Math.atan2(acc.dot(rt), 9.8)));      // into the turn
      const cr = Math.cos(roll), sr = Math.sin(roll); r2.copy(rt).multiplyScalar(cr).addScaledVector(dn, sr); d2.copy(dn).multiplyScalar(cr).addScaledVector(rt, -sr);
      for (let m = 0; m < 2; m++) {
        if (b.kind === 1) { const a = flapOff * 1, ca = Math.cos(a), sa = Math.sin(a); rt.copy(r2).multiplyScalar(m ? -ca : ca).addScaledVector(d2, -sa); dn.crossVectors(f, rt); set.set(i * 2 + m, p, rt.normalize(), f, d2, b.w * size, b.h * size, false); }
        else set.set(i * 2 + m, p, r2, f, d2, b.w * size, b.h * size, m === 1);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
}

// ---------------------------------------------------------------- plane shavings and sawdust: curled ribbons of veneer
async function buildShavings(W) {
  const { look, style, hero } = W, rng = W.rng.fork('shavings'), pb = style.builder(), A = [], B = [];
  // one long loose curl of veneer: an open ribbon, a turn and a half, opening as it goes, so its thin edge and its inside both show
  for (let i = 0; i <= 22; i++) { const t = i / 22, a = t * 1.5 * 6.2832, r = 0.3 + 0.55 * t, xa = t * 1.5 - 0.75; A.push(V3(xa - 0.27, r * Math.cos(a), r * Math.sin(a))); B.push(V3(xa + 0.27, r * Math.cos(a), r * Math.sin(a))); }
  pb.strip(A, B, { sp: S.sycamore, ang: 0.2 });
  // a ribbon of veneer has two faces: the inside of the curl is a step darker (oak), let in a hair inside the sycamore
  { const A2 = [], B2 = []; for (let i = 0; i <= 22; i++) { const t = i / 22, a = t * 1.5 * 6.2832, r = 0.3 + 0.55 * t - 0.03, xa = t * 1.5 - 0.75; A2.push(V3(xa - 0.262, r * Math.cos(a), r * Math.sin(a))); B2.push(V3(xa + 0.262, r * Math.cos(a), r * Math.sin(a))); }
    pb.strip(A2, B2, { sp: S.oak, ang: 0.2 }); }
  const blow = look.weather === 'blow', nCh = W.chimneys.length * 6, nDust = Math.round(150 * look.detail), nSea = Math.round((blow ? 200 : look.weather === 'calm' ? 60 : 110) * look.detail), nBow = W.ships.length * 2, nCrest = Math.round(44 * look.detail);
  const N = nCh + nDust + nSea + nBow + nCrest, sw = {}, KW = Math.PI * 2 / SEA.swellL, crestK = look.weather === 'calm' ? 0.6 : blow ? 1.15 : 1, mesh = new THREE.InstancedMesh(pb.build(), W.pieceMat, N); mesh.frustumCulled = false; W.scene.add(mesh);
  const R = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) R[i] = rng();
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), qb = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), ax = new THREE.Vector3(), wx = -look.side * 0.5;
  W.updateShavings = (time, camZ) => {
    let i = 0; const E = mesh.instanceMatrix.array;      // (each matrix is copied straight into the instance array: setMatrixAt's own sixteen stores, without three's toArray)
    for (let c = 0; c < W.chimneys.length; c++) for (let k = 0; k < 6; k++, i++) {          // curls rising from the chimneys instead of smoke
      const ch = W.chimneys[c], r = R[i * 3], age = (time * 0.09 + k / 6 + r * 0.15) % 1, s = (0.9 + 2.2 * age) * Math.min(1, age * 7) * Math.min(1, (1 - age) * 5);
      p.set(ch.x + wx * age * 16 + Math.sin(age * 7 + r * 6) * 1.2, ch.y + age * 15, ch.z + age * 9); q.setFromAxisAngle(ax.set(0.5, r, 0.6).normalize(), time * (0.6 + r) + r * 6); m.compose(p, q, sc.set(s, s, s)); E.set(m.elements, i * 16);
    }
    for (let k = 0; k < nDust; k++, i++) {                                                   // sawdust hanging in the study and down the street
      const r = R[i * 3], r1 = R[i * 3 + 1], r2 = R[i * 3 + 2], inStudy = k % 2 === 0, s = 0.09 + 0.15 * r2;
      const fall = (time * (0.05 + 0.05 * r) + r1) % 1;
      if (inStudy) p.set(-13 + 26 * r + 0.8 * Math.sin(time * 0.3 + r1 * 9), 19.5 - fall * 18, 2 + 30 * r2 + 0.6 * Math.cos(time * 0.23 + r * 9));
      else p.set(-8 + 16 * r + Math.sin(time * 0.3 + r1 * 9), PAVE + 16 - fall * 15, 36 + ((r2 * 220 + time * 1.5) % 220));
      q.setFromAxisAngle(ax.set(r, r1, r2).normalize(), time * (0.8 + r1) + r * 6); m.compose(p, q, sc.set(s, s, s)); E.set(m.elements, i * 16);
    }
    for (let k = 0; k < nSea; k++, i++) {                                                    // shavings flying off the crests
      const r = R[i * 3], r1 = R[i * 3 + 1], r2 = R[i * 3 + 2], v = blow ? 15 : 5, zz = Math.max(camZ, 250) - 20 + ((r * 260 + time * v * (0.6 + 0.8 * r1)) % 260) * 0.5;
      const age = ((r * 260 + time * v * (0.6 + 0.8 * r1)) % 260) / 260, hop = Math.abs(Math.sin(age * 9 + r2 * 6)), s = (blow ? 1.45 : 1.35) * (0.7 + 0.6 * r2) * Math.min(1, age * 20) * Math.min(1, (1 - age) * 20);
      const x = (r1 < 0.5 ? -1 : 1) * (10 + (r1 - 0.5) * (r1 - 0.5) * 500); p.set(x, 0.9 + hop * (blow ? 5 : 2.2), Math.max(268, zz)); { const ld = W.ships[0]; if (ld && x * ld.x > 0 && Math.abs(x) > 12 && (ld.z ?? 300) + 30 * ld.scale > camZ && (ld.z ?? 300) - camZ < 90 && p.z < (ld.z ?? 300) + 30 * ld.scale) p.y = -9; }
      q.setFromAxisAngle(ax.set(1, 0.2 * r, 0.3 * r2).normalize(), -time * (1.5 + 2 * r2) + r * 6); m.compose(p, q, sc.set(s, s, s)); E.set(m.elements, i * 16);
    }
    for (let b = 0; b < nBow; b++, i++) {                                                    // two curls planing off each bow
      const sh = W.ships[b >> 1], e = b % 2 ? 1 : -1, s = Math.min(2.3 * sh.scale, 1.5 + 0.45 * sh.scale); p.set(sh.x + e * 3.6 * sh.scale, 1.5 * sh.scale + sh.g.position.y, (sh.z ?? 300) + 12.5 * sh.scale);
      q.setFromAxisAngle(ax.set(1, 0, 0), -time * 3.2 - b); q.premultiply(qb.setFromAxisAngle(ax.set(0, 1, 0), e * 0.75 - Math.PI / 2 + 0.25 * Math.sin(time * 1.3 + b))); m.compose(p, q, sc.set(s, s, s)); E.set(m.elements, i * 16);
    }
    // big curls peeling off the crests either side of the course: each rides its own crest (four crests ahead of the
    // lens at any time), so the foreground of the sea is never bare staves
    // (they lie along the crests in loose lines, of four sizes and many tilts; most are small, the large ones only
    // within 20 m of the lens, out at the lower corners of the frame; none stands on a ship, the light or the mole)
    for (let k = 0; k < nCrest; k++, i++) {
      const r = R[i * 3], r1 = R[i * 3 + 1], r2 = R[i * 3 + 2], x = (k % 2 ? 1 : -1) * (14 + 75 * r * r), s0 = Math.max(camZ, 250) - QUAY_Z - 12;
      let sc0 = s0 + (((k % 4) * SEA.swellL + SEA.swellC * hero.sea.uSeaT.value - s0) % 144 + 144) % 144;
      for (let it = 0; it < 2; it++) { swellJS(sc0, x, hero.sea.uSeaT.value, sw); let dp = (sw.ph - 1.2) % 6.2832; if (dp > 3.1416) dp -= 6.2832; if (dp < -3.1416) dp += 6.2832; sc0 -= dp / KW; }
      const edge = Math.min(1, (sc0 - s0) / 10) * Math.min(1, (s0 + 144 - sc0) / 24), zw = QUAY_Z + sc0, onMole = (x > 4 && Math.abs(Math.hypot((x - 11) / 139, (zw - 262) / 283) - 1) * 139 < 9) || Math.hypot(x, zw - RING_Z) < 19;
      let clear = sc0 > 4 && !onMole ? 1 : 0;
      for (const sh of W.ships) if (Math.abs(x - sh.x) < 13 * sh.scale + 3 && Math.abs(zw - (sh.z ?? 300)) < 21 * sh.scale + 4) clear = 0;
      { const ld = W.ships[0]; if (ld && x * ld.x > 0 && (ld.z ?? 300) + 30 * ld.scale > camZ && zw < (ld.z ?? 300) + 30 * ld.scale) clear *= 1 - 0.6 * smooth(105, 80, (ld.z ?? 300) - camZ); }      // only small curls between the lens and the caravel we pass
      if (W.light && x * W.light.x > 0 && W.light.z + 6 > camZ && zw < W.light.z + 14) clear *= 1 - 0.55 * smooth(95, 70, W.light.z - camZ);                                                         // and before the light
      if (W.light) { const L = W.light, tx = L.b.x - L.a.x, tz = L.b.z - L.a.z, tt = clamp01(((x - L.a.x) * tx + (zw - L.a.z) * tz) / (tx * tx + tz * tz)); if (Math.hypot(x - L.x, zw - L.z) < 13 || Math.hypot(x - L.a.x - tx * tt, zw - L.a.z - tz * tt) < 7) clear = 0; }
      const near = 1 - smooth(16, 42, Math.hypot(x, zw - camZ)), cls = [0.5, 0.72, 1, 1.4][Math.floor(r2 * 3.999)];
      const s = cls * (0.62 + 0.9 * near) * crestK * Math.max(0, edge) * clear;
      p.set(x, hero.seaHeight(x, sc0, time) + 0.5 * s, QUAY_Z + sc0);
      q.setFromAxisAngle(ax.set(1, 0, 0), -time * (0.5 + 0.5 * r1) - r * 6); q.premultiply(qb.setFromAxisAngle(ax.set(0, 0, 1), (r - 0.5) * 1.3)); q.premultiply(qb.setFromAxisAngle(ax.set(0, 1, 0), (r1 - 0.5) * 1.9)); m.compose(p, q, sc.set(s, s, s)); E.set(m.elements, i * 16);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
}

// ---------------------------------------------------------------- RARE: the lid comes down
// The tambour reverses and the sea is closed over the harbour: staves run on past the lip, round the top of the
// roll and down a slope toward the city, the handle rail leading, a caravel hanging keel-up beneath.
async function buildLid(W) {
  const { hero, style, sun } = W, rng = W.rng.fork('lid'), SW = 6.5, NS = 150, TH0 = SEA.lipAngle, TH1 = Math.PI + 1.0, ARC = (TH1 - TH0) * SEA.R, HWd = SEA.halfWidth - 2;
  const pb = style.builder();
  for (let v = 0; v < 2; v++) for (let k = 0; k < 8; k++) { const x0 = -HWd + (2 * HWd * k) / 8, x1 = x0 + (2 * HWd) / 8; pb.quad(V3(x0, v * 40, -SW / 2), V3(x1, v * 40, -SW / 2), V3(x1, v * 40, SW / 2), V3(x0, v * 40, SW / 2), { sp: (k * 3 + v) % 4 === 0 ? S.sycamore : S.harewood, ang: 0 }); }
  const geo = pb.build(); geo.setDrawRange(0, 48);
  const staves = new THREE.InstancedMesh(geo, W.pieceMat, NS); staves.frustumCulled = false; W.scene.add(staves);
  const lb = style.builder();
  for (let k = 0; k < 20; k++) { const x0 = -HWd + (2 * HWd * k) / 20, xc = x0 + HWd / 20; lb.block(new THREE.Matrix4().makeTranslation(xc, 0, 5), (2 * HWd) / 20, 10, 12, { sp: k % 2 ? S.rosewood : S.pear, top: S.walnut, sides: k % 2 ? S.pear : S.rosewood, ends: S.ebony }); }
  for (let f = 0; f < 10; f++) { const a0 = (f / 10) * 6.2832, a1 = ((f + 1) / 10) * 6.2832, nn = V3(0, Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2));
    for (let k = 0; k < 10; k++) { const x0 = -HWd + (2 * HWd * k) / 10, x1 = x0 + (2 * HWd) / 10, P = (x, a) => V3(x, 24 + 6 * Math.cos(a), 5 + 6 * Math.sin(a)); lb.quad(P(x0, a0), P(x1, a0), P(x1, a1), P(x0, a1), { sp: grade(nn, sun, 1) }); } }
  for (let k = 0; k <= 10; k++) lb.block(new THREE.Matrix4().makeTranslation(-HWd + (2 * HWd * k) / 10, 12, 5), 6, 14, 6, { sp: S.walnut, sides: S.pear, ends: S.rosewood });
  const lip = W.mesh(lb); lip.frustumCulled = false; lip.matrixAutoUpdate = false;
  const ship = hero.makeCaravel(); ship.matrixAutoUpdate = false; ship.frustumCulled = false; W.scene.add(ship);
  const lidPt = (s, out) => {
    const th = Math.min(TH1, TH0 + Math.max(0, s) / SEA.R), over = Math.max(0, s - ARC);
    out.z = QUAY_Z + SEA.flat + SEA.R * Math.sin(th) + over * Math.cos(TH1); out.y = SEA.R * (1 - Math.cos(th)) + over * Math.sin(TH1); out.th = th; return out;
  };
  const o = {}, X = V3(1, 0, 0), T = new THREE.Vector3(), Nn = new THREE.Vector3(), P = new THREE.Vector3(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sc = new THREE.Vector3(1, 1, 1), bx = new THREE.Vector3();
  const frame = (s) => { lidPt(s, o); T.set(0, Math.sin(o.th), Math.cos(o.th)); Nn.set(0, Math.cos(o.th), -Math.sin(o.th)); P.set(0, o.y, o.z); };
  W.lidFront = new THREE.Vector3();
  // the lid's front edge: live's own law of the clock and u, as one function, so that the gaze works the point out for the place it is
  // asked about (round 10: the rare visit's look read the point update() had written for the place before; its first frame was stale)
  const lidFrontOf = (time, u) => Math.max(4, 886 * smooth(0.05, 0.5, u) + 5 * Math.sin(time * 0.33) * (u < 0.002 || u > 0.5 ? 1 : 0) - 5);
  W.lidFrontAt = (time, u, out) => { frame(lidFrontOf(time, u)); return out.copy(P).addScaledVector(Nn, 26); };
  W.updateLid = (time, u) => {
    const front = lidFrontOf(time, u), E = staves.instanceMatrix.array;
    for (let k = 0; k < NS; k++) {
      const s = front - (k + 0.5) * SW;
      if (s < -SW) { M.makeScale(0, 0, 0); E.set(M.elements, k * 16); continue; }
      frame(s); M.makeBasis(X, Nn, T); M.setPosition(P.x + ((k * 137) % 5 - 2) * 55, P.y, P.z); E.set(M.elements, k * 16);
    }
    staves.instanceMatrix.needsUpdate = true;
    frame(front); lip.matrix.makeBasis(X, Nn, T).setPosition(P); lip.matrixWorldNeedsUpdate = true; W.lidFront.copy(P).addScaledVector(Nn, 26);
    frame(Math.max(0, front - 26)); bx.copy(T); M.makeBasis(bx, Nn, X.clone().cross(Nn).negate()); Q.setFromRotationMatrix(M);
    P.x = -12; ship.matrix.compose(P, Q, Sc.set(1.6, 1.6, 1.6)); ship.matrixWorldNeedsUpdate = true;
  };
}

// ---------------------------------------------------------------- the flight
function finish(W, sky) {
  const { hero, look, path, scene, style } = W, cam = new THREE.Vector3(), size = new THREE.Vector2(), gaze = new THREE.Vector3(), gaze2 = new THREE.Vector3(), gaze3 = new THREE.Vector3();
  if (look.rare) hero.setDraw(-1);
  const poiHigh = V3(-30, 200, QUAY_Z + SEA.flat + 250), poiWall = V3(0, 260, QUAY_Z + SEA.flat + 250), ringC = V3(0, 12, RING_Z), poiVault = V3(0, PAVE + 18.5, 111), poiLight = V3(W.light.x, W.light.top, W.light.z), lead = W.ships[0];
  const update = (dt, time, camera, u = 0) => {
    if (camera && camera.matrixWorld) cam.setFromMatrixPosition(camera.matrixWorld); else path.pointAt(u, cam);
    hero.update(dt, time, camera);
    style.uniforms.uSun.value.copy(look.sun);
    W.leafU.uCamZ.value = cam.z;
    sky.mesh.position.copy(cam); sky.U.uDrift.value = time * 0.011; sky.U.uCamS.value.copy(cam);
    // the window leaves slide apart in their grooves (half apart when first seen, clear of the course as we pass)
    const open = 0.5 + 0.5 * smooth(0.0, 0.042, u) + (u < 0.002 ? 0.05 * Math.sin(time * 0.55) : 0);
    for (const l of W.windowLeaves) l.mesh.position.x = l.side * 8 * open;
    if (W.finch) { const c = (time * 0.33) % 2, s = c < 1 ? smooth(0.3, 0.5, c) : 1 - smooth(1.3, 1.5, c), hop = Math.sin(Math.PI * (c < 1 ? smooth(0.3, 0.5, c) : smooth(1.3, 1.5, c))); W.finch.mesh.position.set(0, W.finch.d.y * s + 0.5 * hop, W.finch.d.z * s); }
    for (const f of W.live) f(time, u);
    W.updateFleet(time, cam.z); W.updateBirds(time, u, cam.z, cam); W.updateShavings(time, cam.z);
    if (W.updateLid) W.updateLid(time, u);
  };
  update(0, 0, null, 0);
  return {
    scene, path, duration: DURATION, title: look.title,
    // slow in the study, a little slower again beside the caravel and the light (the close pass), near 1 over the last tenth
    pace: (u) => 0.5 + 0.55 * smooth(0.03, 0.09, u) + 0.12 * smooth(0.44, 0.52, u) - 0.16 * (smooth(0.53, 0.58, u) - smooth(0.7, 0.76, u)) - 0.15 * smooth(0.8, 0.9, u),
    ride: 'none', style: 'none', companion: 'none',
    camera: { fov: 62, near: 0.3, far: 4000, lookAhead: 34, sway: 0.25, bank: 0.2 },
    pois: [
      look.rare ? { at: (time, u) => W.lidFrontAt(time, u, gaze), from: 0.08, to: 0.54, weight: 0.5 } : { at: poiVault, from: 0.105, to: 0.2, weight: 0.5 },      // up into the coffered vault of the bridge as we come to it (rare: up to the lid coming down)
      ...(look.rare ? [] : [{ at: poiWall, from: 0.27, to: 0.5, weight: 0.16 }]),
      { at: (time, u) => gaze2.set(lead.x, 13.5 * lead.scale, W.leadZ(time, path.pointAt(u, gaze3).z)), from: 0.5, to: 0.665, weight: 0.52 },      // the caravel passed close on the sun's side: whole in the frame, masthead to keel
      { at: poiLight, from: 0.64, to: 0.775, weight: 0.42 },                                       // then the breakwater light on the other side
      ...(look.rare ? [{ at: ringC, from: 0.76, to: 1, weight: 0.5 }] : [{ at: poiHigh, from: 0.72, to: 0.87, weight: 0.6 }, { at: ringC, from: 0.86, to: 1, weight: 0.5 }]),
    ],
    portal: { shape: 'circle', radius: 7, color: '#DDBB62', glow: 0.15, revealDistance: 260, blendDistance: 25 },      // the woods keep their own colours to the last 25 m
    post: { exposure: 1, bloom: { strength: 0.04, radius: 0.3, threshold: 2.2 },
      grade: { saturation: 1, contrast: 1, tint: '#ffffff', shadowTint: '#000000', vignette: 0.14, grain: 0.012, aberration: 0 } },
    update,
    dispose() { hero.dispose(); style.uniforms.uGrain.value.dispose(); },
  };
}
