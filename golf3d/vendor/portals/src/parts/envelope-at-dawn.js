// THE ENVELOPE AT DAWN: its parts
// The cloth of a hot-air balloon's envelope as real geometry, moved on the processor every frame from two things alone: the
// state the world hands it (a plain function of the metres flown) and the world's clock (the ripple, a loop of 40 s). The same
// functions place the lens and the gaze, so the gate measures the cloth that is drawn.
import * as THREE from 'three';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), lerp = (a, b, f) => a + (b - a) * f, TAU = Math.PI * 2;
const sst = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// OURS, about three times life: the mouth 9 m in radius, the greatest radius 30 m at 46 m above the mouth, the crown's hole
// 8.5 m in radius at 70.9 m; the burner frame hangs 9 m under the mouth; the envelope stands leaning 18 degrees downwind.
export const EV = { H: 70.935, R: 30, RM: 9, HB: 46, NG: 24, SEG: 6, NV: 84, HOLE: 8.5, CAB: 9, UP: 72 * Math.PI / 180, PANEL: 11, NB: 8, LOOP: 40 };
export const profR = (h) => (h <= 46 ? 9 + 21 * Math.sin(Math.PI * h / 92) : 30 * Math.sqrt(Math.max(0, 1 - ((h - 46) / 26) ** 2)));
// the sun: 10 degrees up, 20 degrees east of downwind (downwind is -z)
export const SUN = new THREE.Vector3(Math.sin(20 * Math.PI / 180) * Math.cos(10 * Math.PI / 180), Math.sin(10 * Math.PI / 180), -Math.cos(20 * Math.PI / 180) * Math.cos(10 * Math.PI / 180)).normalize();

// ---------------------------------------------------------------- the frame of the standing up
// th: how far the envelope has stood up (0 lying, EV.UP standing). The basket tips up about its lower edge; the burner frame F
// rides on it; the envelope's axis runs from F.
export function frameOf(th, o = {}) {
  const be = (Math.PI / 2) * sst(th / EV.UP, 0, 1), sb = Math.sin(be), cb = Math.cos(be);
  o.be = be; o.by = 0.25 + 1.8 * cb; o.bz = -1.8 + 1.8 * sb; o.fy = o.by + 6 * sb; o.fz = o.bz - 6 * cb; o.s = Math.sin(th); o.c = Math.cos(th);
  return o;
}
// the cross-section h metres up the axis from the mouth: its middle (cy, cz), its half width ax and half height b
export function sectionOf(h, st, fr, o = {}) {
  const hc = clamp(h, 0, EV.H), r = profR(hc), d = EV.CAB + hc, axY = fr.fy + fr.s * d;
  const up = sst(st.th, 0.06, 0.75), wave = 1 - sst(hc, st.hf - 16, st.hf + 6);
  let kL = 0.07 + 0.55 * wave; kL = 1 + (kL - 1) * sst(hc, 0, 14);
  const k = kL + (1 - kL) * up, b = k * r, lam = 1 - sst(st.th, 0, 0.55);
  o.r = r; o.b = b; o.ax = (1 + 0.5 * Math.pow(1 - k, 1.5)) * r; o.cy = axY + lam * Math.max(0, 0.94 * b - axY); o.cz = fr.fz - fr.c * d; o.up = up; o.wave = wave; o.h = hc;
  return o;
}
const _fr = {}, _sec = {};
// a point given from the middle of the section at h: x to the side, w across (up when lying, upwind when standing)
export function scPoint(x, h, w, st, out = new THREE.Vector3()) {
  const fr = frameOf(st.th, _fr), sec = sectionOf(h, st, fr, _sec), dh = h - sec.h;
  return out.set(x, sec.cy + fr.s * dh + fr.c * w, sec.cz - fr.c * dh + fr.s * w);
}

// ---------------------------------------------------------------- shared GLSL
const NOISE = /* glsl */`
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hash21(i), hash21(i+vec2(1., 0.)), f.x), mix(hash21(i+vec2(0., 1.)), hash21(i+vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a*vnoise(p); p = p*2.03+17.1; a *= .5; } return s; }
`;
const LIGHT = /* glsl */`
uniform vec3 uSun, uSunCol, uSkyCol, uFogCol, uBurnP, uBurnCol;
uniform float uBurn, uFog, uMist, uTime, uGround;
// the air blues with distance and goes gold toward the sun; under it a layer of ground mist that thins with height (40 m),
// so the valleys fill and the ridges stand out of it
vec3 mist(vec3 col, vec3 p, float dist){
  float ts = pow(max(dot((p-cameraPosition)/max(dist, .001), uSun), 0.), 3.);
  col = mix(col, mix(uFogCol, vec3(.95, .56, .28), .6*ts), 1.-exp(-dist*uFog));
  float hp = max(p.y-uGround, 0.), hc = max(cameraPosition.y-uGround, 0.), dh = abs(hc-hp);
  float od = dh < .5 ? exp(-hp/40.) : 40.*(exp(-min(hp, hc)/40.)-exp(-max(hp, hc)/40.))/dh;
  return mix(col, mix(vec3(.36, .43, .68), vec3(1.02, .62, .32), .8*ts), 1.-exp(-dist*uMist*od));
}
`;
const PALETTE = /* glsl */`
const vec3 HIDE = vec3(.12, .05, .03), CRIMSON = vec3(.62, .03, .05), TANGERINE = vec3(.92, .27, .03), SAFFRON = vec3(.96, .62, .06), TEAL = vec3(.03, .42, .40), COBALT = vec3(.05, .11, .56), PLUM = vec3(.36, .05, .36), CHAR = vec3(.03, .03, .04);
vec3 six(float i){ return i < .5 ? CRIMSON : (i < 1.5 ? TANGERINE : (i < 2.5 ? SAFFRON : (i < 3.5 ? TEAL : (i < 4.5 ? COBALT : PLUM)))); }
`;

// ---------------------------------------------------------------- the light, the uniforms all materials share
export function makeDawn() {
  const U = {
    uTime: { value: 0 }, uSun: { value: SUN.clone() }, uSunCol: { value: new THREE.Vector3(3.0, 1.82, 0.86) }, uSkyCol: { value: new THREE.Vector3(0.24, 0.37, 0.80) },
    uFogCol: { value: new THREE.Vector3(0.30, 0.40, 0.66) }, uFog: { value: 0.0001 }, uMist: { value: 0.0006 }, uGround: { value: 0 },
    uBurnP: { value: new THREE.Vector3() }, uBurnCol: { value: new THREE.Vector3(1.0, 0.56, 0.18) }, uBurn: { value: 0 },
    uAmb: { value: new THREE.Vector3(0.2, 0.13, 0.09) }, uHoleC: { value: new THREE.Vector3() }, uHoleN: { value: new THREE.Vector3(0, 1, 0) }, uOpen: { value: 0 },
    uHf: { value: 200 }, uUp: { value: 0 }, uBal: { value: Array.from({ length: EV.NB }, () => new THREE.Vector4(0, -9999, 0, 0)) }, uPx: { value: 400 },
  };
  const mats = [];
  const M = (o) => { const m = new THREE.ShaderMaterial(o); m.uniforms = Object.assign(m.uniforms, U); mats.push(m); return m; };

  // ---- the cloth of our envelope, seen from within and from without
  const clothV = /* glsl */`
    attribute vec2 aAux; varying vec3 vP, vN; varying vec2 vUv, vAux;
    void main(){ vP = position; vN = normal; vUv = uv; vAux = aAux; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`;
  const clothF = /* glsl */`
    precision highp float;
    ${LIGHT} ${NOISE} ${PALETTE}
    uniform vec3 uAmb, uHoleC, uHoleN; uniform float uOpen, uHf, uUp, uPanel; uniform vec4 uBal[${EV.NB}];
    varying vec3 vP, vN; varying vec2 vUv, vAux;
    vec3 pattern(float g, float v){
      float gi = floor(g), band = floor(v*30.);
      if (uPanel > .5) return mod(gi, 2.) < 1. ? SAFFRON : TANGERINE;
      if (v < .011) return HIDE;
      if (v < .215) return mod(gi, 2.) < 1. ? COBALT : CRIMSON;
      if (v < .868) return six(mod(gi+band, 6.));
      return mod(gi, 2.) < 1. ? SAFFRON : CRIMSON;
    }
    float shadowAt(vec3 p){
      float s = 1.;
      for (int i = 0; i < ${EV.NB}; i++){
        vec4 b = uBal[i]; if (b.w <= 0.) continue;
        vec3 d = b.xyz-p; float t = dot(d, uSun); if (t <= 0.) continue;
        float q = length(d-uSun*t); s *= 1.-.9*(1.-smoothstep(b.w-1.6, b.w+1.6, q));
        vec3 d2 = d-vec3(0., b.w*1.02, 0.); t = dot(d2, uSun); q = length(d2-uSun*t); s *= 1.-.9*(1.-smoothstep(b.w*.52-1.4, b.w*.52+1.4, q));
        d2 = d-vec3(0., b.w*2.08, 0.); t = dot(d2, uSun); q = length(d2-uSun*t); s *= 1.-.85*(1.-smoothstep(1.6, 3.2, q));
      }
      return s;
    }
    void main(){
      vec3 N = normalize(vN), V = normalize(cameraPosition-vP);
      float g = vUv.x, v = vUv.y, r = max(vAux.x, 1.);
      vec3 base = pattern(g, v);
      // the load tapes between the gores, the sewn seams between the panels
      float gw = 6.2832*r/${EV.NG}., fg = fract(g), dg = min(fg, 1.-fg)*gw, pg = fwidth(g)*gw+1e-4;
      float tape = uPanel > .5 ? 1.-smoothstep(.07, .07+pg, min(fg, 1.-fg)*6.2832*r/24.) : 1.-smoothstep(.11, .11+pg, dg);
      float fb = fract(v*30.), db = min(fb, 1.-fb)*3.4, pb = fwidth(v*30.)*3.4+1e-4;
      float seam = (1.-smoothstep(.03, .03+pb, db))*(1.-uPanel);
      // creases: where the cloth is slack the light through it runs in long folds
      float wave = 1.-smoothstep(uHf-16., uHf+6., vAux.y), slack = (1.-uUp)*mix(1., .5, wave);
      float cr = sin(g*23.+3.5*sin(v*31.+g*1.7))*.5+sin(g*61.+v*40.+2.*sin(v*90.))*.3+sin(v*210.+g*9.)*.2;
      float fold = 1.+(.34*slack+.035)*cr;
      float dn = dot(N, V);
      if (uPanel > .5 && dn > 0.){ N = -N; dn = -dn; }          // the rip top is seen from within on both its faces
      float ndl = dot(N, uSun);
      vec3 tr = pow(base, vec3(.82));
      float onGround = smoothstep(uGround+.15, uGround+2.2, vP.y);
      vec3 Lb = uBurnP-vP; float lb = length(Lb);
      vec3 Lh = uHoleC-vP; float lh = length(Lh);
      vec3 col;
      if (dn < 0.){
        // from within: the sun through the cloth on its own side, the sky's blue through every side, the light thrown about inside
        float sunT = smoothstep(-.10, .55, ndl)*shadowAt(vP)*onGround;
        float hot = pow(max(dot(-V, uSun), 0.), 6.);
        vec3 sunC = mix(uSunCol, vec3(dot(uSunCol, vec3(.3333)))*1.05, .3);
        col = tr*sunC*sunT*(.32+.24*hot)*fold;
        col += tr*uSkyCol*(.17+.10*N.y)*mix(.35, 1., onGround)*fold;
        col += base*uAmb*(.55+.25*cr*slack);
        col += tr*vec3(.25, .23, .22)*(1.-onGround)*(1.-uUp);
        // the burner: the cloth lit, falling off with distance from the flame
        col += (base+.03)*uBurnCol*uBurn*max(dot(-N, Lb/lb), .16)*500./(120.+lb*lb);
        // the mouth: the day comes in from below, off the land
        col += base*vec3(.46, .50, .44)*max(dot(-N, Lb/lb), .12)*(300./(170.+lb*lb)+.10*(1.-uUp));
        // the open top: daylight from the hole, and the sun's own beam where it strikes
        col += base*uSkyCol*uOpen*max(dot(-N, Lh/lh), 0.)*300./(260.+lh*lh);
        float hd = dot(uSun, uHoleN), ht = dot(uHoleC-vP, uHoleN)/hd;
        float beam = ht > 0. ? 1.-smoothstep(${(EV.HOLE - 0.7).toFixed(2)}, ${(EV.HOLE + 0.5).toFixed(2)}, length(vP+uSun*ht-uHoleC)) : 0.;
        col += base*uSunCol*beam*uOpen*(.3+.7*max(dot(-N, uSun), 0.))*1.25*(1.-uPanel);
        col = mix(col, col*.16+CHAR*(uAmb+uSkyCol*.08), tape*.92);
        col *= 1.-.42*seam;
      } else {
        // from without
        col = base*(uSunCol*max(ndl, 0.)*.62+uSkyCol*(.46+.26*N.y))*fold;
        col += pow(base, vec3(1.3))*uSunCol*(1.-smoothstep(-.6, .2, ndl))*(.12+.28*pow(max(dot(-V, uSun), 0.), 2.))*fold;   // the sun through from the far side
        col += tr*uBurnCol*uBurn*300./(160.+lb*lb);
        col += (base+.05)*vec3(.95, 1., 1.1)*uOpen*exp(-max(lh-${EV.HOLE.toFixed(1)}, 0.)/5.5)*.85;                    // the ring's light on the crown
        col = mix(col, col*.3, tape*.8);
        col *= 1.-.3*seam;
        col = mist(col, vP, length(cameraPosition-vP));
      }
      gl_FragColor = vec4(col, 1.);
    }`;
  const cloth = (panel) => M({ vertexShader: clothV, fragmentShader: clothF, side: THREE.DoubleSide, uniforms: { uPanel: { value: panel ? 1 : 0 } } });

  // ---- the sky
  const sky = () => M({ side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: {},
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*position, 1.); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      ${LIGHT} ${NOISE}
      varying vec3 vD;
      void main(){
        vec3 d = normalize(vD); float h = max(d.y, 0.);
        vec2 dh = normalize(d.xz+1e-5), sh = normalize(uSun.xz);
        float sa = dot(dh, sh);
        vec3 zen = vec3(.026, .075, .29), mid = vec3(.13, .27, .64), hor = vec3(.42, .50, .76);
        vec3 c = mix(mid, zen, smoothstep(.12, .8, h)); c = mix(hor, c, smoothstep(0., .26, h));
        // toward the sun: peach, then hot orange low down
        c = mix(c, vec3(1.05, .58, .34), exp(-h*3.2)*pow(max(sa, 0.), 1.4)*.8);
        c = mix(c, vec3(1.6, .72, .17), exp(-h*9.)*pow(max(sa, 0.), 2.6)*.92);
        // away from it: the rose band over the blue shadow of the earth
        c = mix(c, vec3(.96, .52, .62), exp(-abs(h-.12)*12.)*max(-sa, 0.)*.62);
        c = mix(c, vec3(.24, .30, .52), exp(-h*24.)*max(-sa, 0.)*.8);
        float low = exp(-h*5.5);
        // high thin cloud, lit from below by the sun that has not reached the meadow yet
        vec2 q = d.xz/max(d.y+.12, .03)*1.4;
        float cf = fbm(q*vec2(.55, 1.5)+vec2(3.1, .7));
        float cl = smoothstep(.46, .78, cf)*smoothstep(.02, .22, d.y)*(1.-smoothstep(.6, .95, d.y));
        vec3 clc = mix(vec3(.98, .48, .46), vec3(1.45, .92, .48), pow(max(sa, 0.), 1.5))*(.55+.45*low);
        c = mix(c, clc, cl*(.5+.35*max(sa, 0.)));
        // long bars of low cloud toward the sun, dark with burning lower edges
        float bf = fbm(vec2(atan(d.x, -d.z)*2.2+1.7, h*34.));
        float bar = smoothstep(.52, .70, bf)*smoothstep(.015, .05, h)*(1.-smoothstep(.16, .30, h))*pow(max(sa, 0.), 1.2);
        c = mix(c, mix(vec3(1.5, .80, .30), vec3(.40, .30, .46), smoothstep(.56, .74, bf)), bar*.8);
        // the sun: a small disc in a tight glow
        float sd = max(dot(d, uSun), 0.);
        c += vec3(1., .78, .46)*(smoothstep(.99988, .99996, sd)*26.+pow(sd, 1400.)*.9+pow(sd, 80.)*.14+pow(sd, 8.)*.03);
        if (d.y < 0.) c = mix(c, uFogCol, (1.-smoothstep(-.05, 0., d.y)));
        gl_FragColor = vec4(c, 1.);
      }` });

  // ---- the land: the launch meadow, the river sunward of it, hedged fields beyond, mist; the long shadows of trees (baked), of
  // hedges and of every balloon (by place: each balloon's own outline carried down the sun's rays)
  const land = (tex) => M({ uniforms: { tLand: { value: tex }, uBalG: { value: Array.from({ length: 24 }, () => new THREE.Vector4(0, 0, 0, 0)) } },
    vertexShader: /* glsl */`attribute float aSh; varying vec3 vP, vL, vN; varying float vSh; void main(){ vL = position; vN = normal; vSh = aSh; vec4 w = modelMatrix*vec4(position, 1.); vP = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      ${LIGHT} ${NOISE}
      uniform sampler2D tLand; uniform vec4 uBalG[24];
      varying vec3 vP, vL, vN; varying float vSh;
      float riverZ(float x){ return -215.-45.*sin(x/150.+1.)-15.*sin(x/55.+.4); }
      float profR(float h){ return h <= 46. ? 9.+21.*sin(3.14159*h/92.) : 30.*sqrt(max(0., 1.-(h-46.)*(h-46.)/676.)); }
      // the fields: a skewed patchwork. x: the metres to the nearest hedge; y, z: two chances of the field
      vec3 fieldAt(vec2 p){
        vec2 w = p+84.*vec2(vnoise(p*.0041+3.)-.5, vnoise(p*.0037+11.)-.5);
        vec2 q = vec2((w.x+.35*w.y+3000.)/118., (w.y-.2*w.x+3000.)/86.);
        float hb = hash21(floor(q*.5)+5.7); vec2 sz = vec2(1.);
        if (hb < .30){ q *= .5; sz = vec2(2.); } else if (hb < .52){ q.x *= .5; sz.x = 2.; } else if (hb < .70){ q.y *= .5; sz.y = 2.; }
        vec2 fi = floor(q), ff = fract(q);
        return vec3(min(min(ff.x, 1.-ff.x)*118.*sz.x, min(ff.y, 1.-ff.y)*86.*sz.y), hash21(fi+sz*3.1), hash21(fi+17.3+sz));
      }
      void main(){
        vec2 p = vL.xz; float dist = length(cameraPosition-vP);
        vec4 t = texture2D(tLand, p/4096.+.5);
        float n1 = fbm(p*.012), nearK = (1.-smoothstep(80., 700., dist)), n2 = fbm(p*.11+7.), n3 = vnoise(p*1.7);
        float rr = length(p), hgt = vL.y;
        vec3 Nv = normalize(vN);
        vec2 a = normalize(uSun.xz); float te = uSun.y/length(uSun.xz);
        float rz = riverZ(p.x), rw = 13.+5.*sin(p.x/90.), rd = abs(p.y-rz);
        // the launch meadow: dew-dark grass, paler where it grows long in drifts, flowers close by
        vec3 grass = mix(vec3(.036, .092, .022), vec3(.062, .124, .028), smoothstep(.3, .7, n1));
        grass = mix(grass, vec3(.100, .128, .040), .5*smoothstep(.46, .70, fbm(p*.045+21.)));
        float bl = vnoise(p*7.)*.45+vnoise(p*19.)*.35+vnoise(p*47.)*.2;
        grass *= mix(1., .72+.56*bl, (1.-smoothstep(4., 60., dist)));
        grass *= .93+.14*n3*(1.-smoothstep(20., 160., dist));
        float px = dist*.0017;   // about the metres one line of the picture spans out there
        float tuft = (vnoise(p*.33)-.5)*(1.-smoothstep(1.2, 4., px))+(vnoise(p*.9+5.)-.5)*.8*(1.-smoothstep(.45, 1.5, px))+(vnoise(p*2.4+9.)-.5)*.6*(1.-smoothstep(.17, .55, px));
        grass *= 1.+.6*tuft;
        // beyond the meadow and over the river: fields, each with a crop of its own, hedges between
        float mead = (1.-smoothstep(250., 276., rr+52.*(n1-.5)))*step(rz, p.y);
        vec3 fl = fieldAt(p);
        vec3 crop = fl.y < .30 ? vec3(.046, .108, .026) : (fl.y < .45 ? vec3(.210, .160, .052) : (fl.y < .70 ? vec3(.080, .158, .032) : (fl.y < .81 ? vec3(.100, .074, .046) : (fl.y < .95 ? vec3(.270, .220, .024) : vec3(.135, .080, .200)))));
        float sd = fl.z < .5 ? p.x+.35*p.y : p.y-.2*p.x, sw = fl.y < .5 ? 9. : 5.;
        float stripe = mix(.5, .5+.5*sin(sd*6.2832/sw), 1.-smoothstep(.15, .5, fwidth(sd)/sw));
        crop *= (.90+.20*stripe)*(.82+.36*n1); crop = mix(vec3(.080, .122, .040)*(.8+.4*n1), crop, .25+.75*(1.-smoothstep(1100., 2400., rr)));
        float hedge = 1.-smoothstep(2.4, 3.8, fl.x+(vnoise(p*.13)-.5)*3.);
        float lowl = (1.-smoothstep(8., 30., hgt))*(1.-smoothstep(1100., 2400., rr)); hedge *= lowl;
        float hsh = max(1.-smoothstep(2.4, 5., fieldAt(p+a*8.).x), .7*(1.-smoothstep(2.4, 5., fieldAt(p+a*17.).x)))*(1.-hedge)*lowl;
        // a lane across the launch field: two ruts worn pale, the grass short between
        float lnd = abs(p.y-(16.+6.*sin(p.x/40.)+3.*sin(p.x/13.+1.)));
        if (p.y > 15.) lnd = min(lnd, abs(p.x-(-28.+8.*sin(p.y/50.))));
        grass = mix(grass, vec3(.095, .112, .044), (1.-smoothstep(1.8, 3.2, lnd))*.4);
        grass = mix(grass, vec3(.21, .165, .095), (1.-smoothstep(.22, .6, abs(lnd-1.1)))*(.55+.45*vnoise(p*1.3))*.85);
        grass = mix(crop, grass, mead);
        grass = mix(grass, vec3(.018, .042, .018)*(.7+.6*vnoise(p*.4)), hedge*(1.-mead));
        grass = mix(grass, vec3(.028, .058, .024), (1.-smoothstep(rw+1., rw+8., rd))*.8);   // the reeds of the banks
        // the foothills are wooded; above the trees grass and scree, then rock, and snow on the far range
        float steep = 1.-Nv.y;
        vec3 forest = mix(vec3(.018, .058, .026), vec3(.036, .092, .030), fbm(p*.006+5.))*(.8+.45*fbm(p*.07+2.)*(1.-smoothstep(250., 1600., dist)));
        grass = mix(grass, forest, smoothstep(10., 48., hgt)*.97);
        vec3 rock = mix(vec3(.165, .120, .100), vec3(.240, .170, .140), fbm(p*.003+1.));
        float alp = smoothstep(400., 620., hgt+90.*(fbm(p*.004+9.)-.5));
        grass = mix(grass, mix(vec3(.095, .110, .045), rock, smoothstep(.10, .30, steep)), alp);
        float snow = smoothstep(780., 960., hgt+150.*(fbm(p*.0025+3.)-.5))*(1.-smoothstep(.42, .72, steep));
        grass = mix(grass, vec3(.52, .52, .60), snow);
        // light: the low sun rakes the land; the long shadows of trees, hedges, balloons and hills
        float trs = .25*(texture2D(tLand, (p+vec2(3., 1.))/4096.+.5).r+texture2D(tLand, (p+vec2(-3., -1.))/4096.+.5).r+texture2D(tLand, (p+vec2(1., -3.))/4096.+.5).r+texture2D(tLand, (p+vec2(-1., 3.))/4096.+.5).r);
        float sh = (1.-.72*trs)*(1.-.6*hsh*(1.-mead))*vSh;
        for (int i = 0; i < 24; i++){
          vec4 b = uBalG[i]; if (b.w <= 0.) continue;
          // b: where a balloon stands, and how high its mouth is over the land. The sun's ray from this ground passes its axis D*te up
          vec2 d = p-b.xz; float D = -dot(d, a); if (D <= 0.) continue;
          float hh = D*te-b.y; if (hh < -15. || hh > 72.) continue;
          float rad = hh < -11.5 ? 2.4 : (hh < 0. ? 0. : profR(min(hh, 72.)));
          float soft = 2.2+D*.045;
          sh *= 1.-.62*b.w*(1.-smoothstep(rad-soft, rad+soft, abs(dot(d, vec2(-a.y, a.x)))))*step(.5, rad);
        }
        // the hills' own relief: gullies and spurs too small for the land's mesh, as a tilt of the light
        vec2 pb = p*.0045+2.3; float e0 = abs(fbm(pb)-.5), hm = smoothstep(25., 110., hgt);
        vec3 nrm = normalize(Nv+vec3(e0-abs(fbm(pb+vec2(.16, 0.))-.5), 0., e0-abs(fbm(pb+vec2(0., .16))-.5))*7.*hm+vec3((n1-.5)*.2*(1.-.7*mead)+(n3-.5)*.1*nearK, 0., (n2-.5)*.18*nearK));
        float ndl = max(dot(nrm, uSun), 0.);
        float sun = 5.*ndl/(1.+2.2*ndl)*sh;
        vec3 col = grass*(uSunCol*sun+uSkyCol*(.30+.26*nrm.y));
        // dew: the grass toward the sun shines pale
        vec3 V = normalize(cameraPosition-vP);
        col += uSunCol*pow(max(dot(normalize(V+uSun), nrm), 0.), 24.)*.06*sh*(1.-smoothstep(20., 700., dist))*(1.-smoothstep(10., 40., hgt));
        // the river: a mirror of the sky, deep overhead and pale far off, and a path of gold toward the sun
        float rv = 1.-smoothstep(rw-2., rw+1., rd);
        vec2 lc = vec2(cos(uTime*${(6.283185307 / EV.LOOP).toFixed(6)}), sin(uTime*${(6.283185307 / EV.LOOP).toFixed(6)}));   // one turn in a loop of the clock: every drift below closes on itself
        vec3 wn = normalize(vec3((vnoise(p*.9+1.9*lc)-.5)*.10, 1., (vnoise(p*.7+9.-1.6*lc.yx)-.5)*.10));
        vec3 rf = reflect(-V, wn); float fres = pow(max(1.-max(V.y, 0.), 0.), 3.);
        vec3 wat = mix(vec3(.030, .085, .26), vec3(.46, .56, .82), fres);
        float gp = max(dot(rf, uSun), 0.);
        wat += vec3(1.5, .86, .36)*(pow(gp, 14.)*.9+pow(gp, 220.)*4.*(.4+1.2*vnoise(p*2.3+8.3*lc)));
        col = mix(col, wat*(.5+.5*sh), rv);
        // mist: in the hollows, and in thin ribbons beside the river
        float mk = .40*t.a*smoothstep(.35, .75, fbm(p*.006+.025*lc));
        mk = max(mk, .42*smoothstep(8., 30., rd)*(1.-smoothstep(30., 130., rd))*smoothstep(.40, .68, fbm(p*.011+3.+.019*lc.yx)));
        float tsm = pow(max(dot(-V, uSun), 0.), 3.);
        col = mix(col, mix(vec3(.50, .56, .78), vec3(1.25, .80, .46), .8*tsm)*(.55+.55*sh), mk*.7);
        col = mist(col, vP, dist);
        gl_FragColor = vec4(col, 1.);
      }` });

  // ---- trees and all that stands: one plain lit surface with a colour to each vertex (aS: 0 leaf, 1 wicker, 2 steel, 3 paint)
  const solid = (inst) => M({ uniforms: {}, side: THREE.DoubleSide, defines: inst ? { INST: 1 } : {},
    vertexShader: /* glsl */`
      attribute vec3 aCol; attribute float aS; varying vec3 vP, vN, vC, vL; varying float vS, vT;
      void main(){ vC = aCol; vS = aS; vL = position; vT = .5;
        #ifdef INST
        vec4 w = modelMatrix*instanceMatrix*vec4(position, 1.); vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal); vT = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233)))*43758.5453);
        #else
        vec4 w = modelMatrix*vec4(position, 1.); vN = normalize(mat3(modelMatrix)*normal);
        #endif
        vP = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      ${LIGHT} ${NOISE}
      varying vec3 vP, vN, vC, vL; varying float vS, vT;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition-vP); if (dot(N, V) < 0.) N = -N;
        vec3 base = vC; float spec = 0.;
        if (vS > .5 && vS < 1.5){            // wicker: weavers over and under the stakes
          float wu = (vL.x+vL.z)*2.6, wy = vL.y*7.; float over = step(.5, fract(wu+.5*mod(floor(wy), 2.)));
          float fine = 1.-smoothstep(.25, .7, fwidth(wy));
          base *= mix(.82, (.50+.50*over)*(.45+.55*sin(fract(wy)*3.1416))+.14, fine); }
        else if (vS > 1.5 && vS < 2.5){ spec = pow(max(dot(reflect(-V, N), uSun), 0.), 40.)*1.2; base *= .8+.2*sin(vL.y*40.); }
        else if (vS > 3.5){ float pl = fract(vL.x*2.1); base *= (.62+.38*smoothstep(.03, .09, pl)*(1.-smoothstep(.93, .98, pl)))*(.8+.4*vnoise(vec2(floor(vL.x*2.1)*7.3, vL.z*2.5))); }   // boards
        else if (vS < .5){ base *= (.50+.85*fbm(vL.xz*5.+vL.y*4.))*(.72+.38*N.y)*mix(vec3(.80, 1., .86), vec3(1.30, 1.08, .66), vT); }
        float ndl = vS < .5 ? max((dot(N, uSun)+.5)/1.5, 0.) : max(dot(N, uSun), 0.);
        vec3 Lb = uBurnP-vP; float lb = length(Lb);
        vec3 col = base*(uSunCol*ndl*.9+uSkyCol*(.40+.28*N.y)+vec3(.20, .24, .09)*(.5-.5*N.y))+uSunCol*spec*.5;
        if (vS < .5) col += base*uSunCol*pow(max(dot(-V, uSun), 0.), 3.)*pow(max(1.-abs(dot(N, V)), 0.), 1.5)*1.6;
        col += base*uBurnCol*uBurn*max(dot(N, Lb/lb), .1)*min(500./(60.+lb*lb), 1.5);
        col = mist(col, vP, length(cameraPosition-vP));
        gl_FragColor = vec4(col, 1.);
      }` });

  // ---- the other balloons (instanced): flat colours in few patterns, each a lantern when its burner fires
  const others = () => M({ uniforms: {}, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aC1, aC2, aC3; attribute vec4 aK; varying vec3 vP, vN, vC1, vC2, vC3; varying vec2 vUv; varying vec4 vK; varying float vY;
      void main(){ vC1 = aC1; vC2 = aC2; vC3 = aC3; vK = aK; vUv = uv; vY = position.y;
        vec4 w = modelMatrix*instanceMatrix*vec4(position, 1.); vN = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal); vP = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      ${LIGHT} ${NOISE}
      varying vec3 vP, vN, vC1, vC2, vC3; varying vec2 vUv; varying vec4 vK; varying float vY;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition-vP); bool back = dot(N, V) < 0.;
        float g = vUv.x, v = vUv.y, gi = floor(g), band = floor(v*14.), k = vK.x;
        vec3 base;
        if (v < -1.5) base = vec3(.030, .026, .024);                                        // ropes, the burner frame
        else if (v < 0.) base = vec3(.20, .115, .045)*(.75+.25*step(.5, fract(vY*2.)));     // the basket
        else if (v < .05) base = vec3(.03, .03, .04);
        else if (k < .5) base = mod(gi, 2.) < 1. ? vC1 : vC2;                                // gores of two colours
        else if (k < 1.5) base = mod(gi+band, 3.) < 1. ? vC1 : (mod(gi+band, 3.) < 2. ? vC2 : vC3);   // a spiral of three
        else if (k < 2.5) base = mod(band, 3.) < 1. ? vC1 : (mod(band, 3.) < 2. ? vC2 : vC3);          // hoops
        else if (k < 3.5) base = mod(floor(v*14.+abs(fract(g*.5)-.5)*4.), 2.) < 1. ? vC1 : vC2;      // a zigzag
        else base = (v > .42 && v < .56) ? vC2 : vC1;                                        // one belt
        float bulge = abs(fract(g)-.5)*2.;
        if (v >= 0.){ base *= .80+.20*(1.-bulge*bulge); N = normalize(N+normalize(cross(vec3(0., 1., 0.), N)+1e-5)*(.5-fract(g))*.6*(back ? -1. : 1.)); }
        float ndl = dot(N, uSun);
        vec3 col = base*(uSunCol*max(ndl, 0.)*.56+uSkyCol*(.30+.20*N.y));
        if (back) col = base*(uSunCol*smoothstep(-.1, .5, ndl)*.5+uSkyCol*.3);
        // the sun comes through the far side and lights the shaded half from within, most when seen against the sun; a burning edge
        float vs = max(dot(-V, uSun), 0.);
        if (v >= 0.){ col += pow(base, vec3(1.3))*uSunCol*(1.-smoothstep(-.55, .25, ndl))*(.14+.30*vs*vs);
          col += uSunCol*pow(max(1.-abs(dot(N, V)), 0.), 4.)*pow(vs, 5.)*.35; }
        // its burner: a loop on the world's clock; the cloth glows from within, strongest low down
        float fire = pow(max(sin(uTime*6.2832*vK.z/${EV.LOOP}.+vK.y), 0.), 5.)*vK.w;
        if (v >= 0.) col += pow(base, vec3(.8))*uBurnCol*fire*(2.2-1.5*smoothstep(0., .7, v));
        col = mist(col, vP, length(cameraPosition-vP));
        gl_FragColor = vec4(col, 1.);
      }` });

  // ---- the flame of our burner
  const flame = () => M({ uniforms: { uLen: { value: 6 }, uRad: { value: 1.5 }, uPow: { value: 0 } }, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: /* glsl */`
      uniform float uLen, uRad, uTime; attribute float aIn; varying vec3 vN, vV, vL, vAx; varying float vY, vIn;
      void main(){ float y = position.y; vY = y; vIn = aIn; vAx = normalize(mat3(modelMatrix)*vec3(0., 1., 0.));
        float rad = uRad*mix(1., .45, aIn)*(.22+.78*smoothstep(0., .4, y))*(1.-.78*smoothstep(.5, 1., y));
        vec3 p = vec3(position.x*rad, y*uLen, position.z*rad);
        p.xz += .22*uRad*y*vec2(sin(uTime*${(57 * 6.283185307 / EV.LOOP).toFixed(5)}+y*7.), cos(uTime*${(46 * 6.283185307 / EV.LOOP).toFixed(5)}+y*5.));
        vL = p; vec4 w = modelMatrix*vec4(p, 1.); vN = normalize(mat3(modelMatrix)*vec3(position.x, .15, position.z)); vV = cameraPosition-w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      precision highp float;
      ${NOISE}
      uniform float uPow, uTime, uLen; varying vec3 vN, vV, vL, vAx; varying float vY, vIn;
      void main(){
        float lw = uTime/${EV.LOOP}., tb = uTime-${EV.LOOP}.;   // the rising noise at this clock and one loop back, crossfaded: the loop closes
        float n = mix(fbm(vec2(vL.x*.9+vL.z*.7, vL.y*.42-uTime*8.)), fbm(vec2(vL.x*.9+vL.z*.7, vL.y*.42-tb*8.)), lw), n2 = mix(fbm(vec2(vL.x*2.3-vL.z*1.9, vL.y*.9-uTime*12.)), fbm(vec2(vL.x*2.3-vL.z*1.9, vL.y*.9-tb*12.)), lw);
        float body = smoothstep(0., .05, vY)*(1.-smoothstep(.34+.60*n, 1., vY));
        vec3 Vn = normalize(vV);
        float edge = pow(abs(dot(normalize(vN), Vn)), 1.2);
        float vis = mix(edge, .5, smoothstep(.45, .92, abs(dot(Vn, vAx))));
        float tong = smoothstep(.30, .62, n*.6+n2*.4+.30*(1.-vY));
        vec3 col = mix(vec3(1., .16, .01), vec3(1., .56, .14), clamp((1.-vY)*.9+.25*vIn, 0., 1.));
        col = mix(col, vec3(1., .86, .50), vIn*(1.-smoothstep(.1, .7, vY)));
        col = mix(col, vec3(.20, .40, 1.), (1.-smoothstep(.0, .10, vY))*.85);
        float a = body*vis*tong*(.55+.9*n2)*uPow;
        gl_FragColor = vec4(col*a*(1.5+.8*vIn), 1.);
      }` });

  // ---- soft lights in the air: the glow about the flame (a point), the sun's shaft through the open top (a sheared tube)
  const glow = () => M({ uniforms: { uPow: { value: 0 }, uSize: { value: 30 } }, transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: /* glsl */`uniform float uPx, uSize; void main(){ vec4 mv = viewMatrix*modelMatrix*vec4(position, 1.); gl_Position = projectionMatrix*mv; gl_PointSize = min(uSize*uPx/max(-mv.z, 1.), 900.); }`,
    fragmentShader: /* glsl */`precision highp float; uniform float uPow; uniform vec3 uBurnCol; void main(){ float r = length(gl_PointCoord-.5)*2.; float a = pow(max(1.-r, 0.), 3.2); gl_FragColor = vec4(uBurnCol*a*uPow, 1.); }` });
  const shaft = () => M({ uniforms: { uGain: { value: 1 } }, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    vertexShader: /* glsl */`varying vec3 vN, vV, vP; varying float vA; void main(){ vA = uv.y; vP = position; vN = normal; vV = cameraPosition-position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      precision highp float;
      ${NOISE}
      uniform vec3 uSunCol; uniform float uOpen, uGain, uTime; varying vec3 vN, vV, vP; varying float vA;
      void main(){
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
        float a = edge*(1.-smoothstep(.55, 1., vA))*smoothstep(0., .04, vA)*(.75+.25*fbm(vP.xz*.2+vP.y*.13+.32*vec2(cos(uTime*${(6.283185307 / EV.LOOP).toFixed(6)}), sin(uTime*${(6.283185307 / EV.LOOP).toFixed(6)}))));
        gl_FragColor = vec4(uSunCol*a*uOpen*uGain*.045, 1.);
      }` });
  return { U, cloth, sky, land, solid, others, flame, glow, shaft, dispose() { for (const m of mats) m.dispose(); } };
}

// ---------------------------------------------------------------- the cloth
export function makeCloth(mat) {
  const NU = EV.NG * EV.SEG, NV = EV.NV, W = NU + 1, n = W * NV;
  const hs = new Float64Array(NV), rs = new Float64Array(NV), arc = new Float64Array(NV);
  { const K = 4000, a = [0], hh = [0]; let h0 = 0, r0 = profR(0), acc = 0;
    for (let i = 1; i <= K; i++) { const h = EV.H * i / K, r = profR(h); acc += Math.hypot(h - h0, r - r0); a.push(acc); hh.push(h); h0 = h; r0 = r; }
    let j = 0; for (let i = 0; i < NV; i++) { const tg = acc * i / (NV - 1); while (j < K - 1 && a[j + 1] < tg) j++; const f = (tg - a[j]) / Math.max(a[j + 1] - a[j], 1e-9); hs[i] = hh[j] + (hh[j + 1] - hh[j]) * f; rs[i] = profR(hs[i]); arc[i] = tg; }
    hs[NV - 1] = EV.H; rs[NV - 1] = EV.HOLE; }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), aux = new Float32Array(n * 2), idx = new Uint32Array(NU * (NV - 1) * 6);
  const cph = new Float64Array(W), sph = new Float64Array(W), bump = new Float64Array(W);
  for (let i = 0; i < W; i++) { const ph = TAU * i / NU; cph[i] = Math.cos(ph); sph[i] = Math.sin(ph); bump[i] = Math.sin(Math.PI * ((i % EV.SEG) / EV.SEG)); }
  let q = 0;
  for (let j = 0; j < NV; j++) for (let i = 0; i < W; i++) { const k = j * W + i; uv[k * 2] = i / EV.SEG; uv[k * 2 + 1] = j / (NV - 1); aux[k * 2] = rs[j]; aux[k * 2 + 1] = hs[j]; }
  for (let j = 0; j < NV - 1; j++) for (let i = 0; i < NU; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  const g = new THREE.BufferGeometry();
  const pa = new THREE.BufferAttribute(pos, 3), na = new THREE.BufferAttribute(nor, 3); pa.setUsage(THREE.DynamicDrawUsage); na.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', pa); g.setAttribute('normal', na); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aAux', new THREE.BufferAttribute(aux, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, -40), 400);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'cloth';
  const fr = {}, sec = {}, w1 = TAU * 7 / EV.LOOP, w2 = TAU * 4 / EV.LOOP, w3 = TAU * 11 / EV.LOOP;
  // the greatest the ripple can move the cloth, in metres, at this state and this height (the gate adds it to every distance)
  const rippleAmp = (h, up, wave) => (0.10 + 0.30 * (1 - up) * (0.3 + 0.7 * wave)) * sst(h, 0, 8) * (1 - 0.7 * sst(h, 64, EV.H));
  function update(st, t) {
    frameOf(st.th, fr); const gy = -st.H + 0.05, tt = t % EV.LOOP;
    for (let j = 0; j < NV; j++) {
      sectionOf(hs[j], st, fr, sec);
      const A = rippleAmp(hs[j], sec.up, sec.wave), s = arc[j], sc0 = 0.02 * sec.up;
      const p1 = 0.19 * s - w1 * tt, p2 = 0.47 * s + w2 * tt + 1.3, p3 = 1.1 * s - w3 * tt;
      for (let i = 0; i < W; i++) {
        const k = (j * W + i) * 3, c = cph[i], sn = sph[i], sc = 1 + sc0 * (bump[i] - 0.6);
        let x = sec.ax * c * sc, w = sec.b * sn * sc;
        const nx = sec.b * c, nw = sec.ax * sn, nl = Math.hypot(nx, nw) || 1;
        const d = A * (0.55 * Math.sin(p1 + 2 * sn) + 0.30 * Math.sin(p2 + 5 * c) + 0.15 * Math.sin(p3 + 3 * TAU * i / NU));
        x += nx / nl * d; w += nw / nl * d;
        const y = sec.cy + fr.c * w;
        pos[k] = x; pos[k + 1] = y < gy ? gy : y; pos[k + 2] = sec.cz + fr.s * w;
      }
    }
    // normals from the grid itself
    for (let j = 0; j < NV; j++) { const j0 = j > 0 ? j - 1 : j, j1 = j < NV - 1 ? j + 1 : j;
      for (let i = 0; i < W; i++) { const i0 = i > 0 ? i - 1 : NU - 1, i1 = i < NU ? i + 1 : 1;
        const a = (j * W + i0) * 3, b = (j * W + i1) * 3, c = (j0 * W + i) * 3, d = (j1 * W + i) * 3, k = (j * W + i) * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[d] - pos[c], vy = pos[d + 1] - pos[c + 1], vz = pos[d + 2] - pos[c + 2];
        let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux; const l = Math.hypot(nx, ny, nz) || 1;
        nor[k] = nx / l; nor[k + 1] = ny / l; nor[k + 2] = nz / l; } }
    pa.needsUpdate = true; na.needsUpdate = true;
  }
  // where the four cables are made fast on the mouth's rim (after an update)
  const rim = (kq, out) => { const i = Math.round(NU * (kq + 0.5) / 4) % NU; return out.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); };
  return { mesh, geometry: g, update, rim, rippleAmp, hs, rs };
}

// ---------------------------------------------------------------- the rip top: a round panel that closes the crown's hole from within
// and, by the metres flown, draws open from its middle as an iris, its cloth gathered into a collar under the hole's rim
export function makePanel(mat) {
  const NR = 8, NS = 48, W = NS + 1, n = (NR + 1) * W;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), aux = new Float32Array(n * 2), idx = [];
  for (let j = 0; j <= NR; j++) for (let i = 0; i < W; i++) { const k = j * W + i; uv[k * 2] = i / NS * 24; uv[k * 2 + 1] = 0.9; aux[k * 2] = Math.max(EV.PANEL * j / NR, 0.4); aux[k * 2 + 1] = EV.H; }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  const pa = new THREE.BufferAttribute(pos, 3), na = new THREE.BufferAttribute(nor, 3); pa.setUsage(THREE.DynamicDrawUsage); na.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', pa); g.setAttribute('normal', na); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aAux', new THREE.BufferAttribute(aux, 2)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'rip-top';
  const fr = {}, sec = {};
  function update(st, t) {
    frameOf(st.th, fr); sectionOf(EV.H, st, fr, sec);
    const o = st.open, rin = o * (EV.HOLE + 0.5), rip = TAU * 3 * (t % EV.LOOP) / EV.LOOP;
    const kx = sec.ax / EV.HOLE, kw = sec.b / EV.HOLE, gy = -st.H + 0.08;
    for (let j = 0; j <= NR; j++) { const rho = rin + (EV.PANEL - rin) * j / NR, gath = 0.32 * o * (1 - j / NR);
      for (let i = 0; i < W; i++) { const ph = TAU * i / NS, k = (j * W + i) * 3;
        const x = kx * rho * Math.cos(ph), w2 = kw * rho * Math.sin(ph);
        const dh2 = -1.2 + 0.7 * sec.up * (1 - o) * (1 - (rho / EV.PANEL) ** 2) + gath * Math.sin(ph * 16 + 0.6 * Math.sin(rip + ph * 3));
        const y = sec.cy + fr.s * dh2 + fr.c * w2;
        pos[k] = x; pos[k + 1] = y < gy ? gy : y; pos[k + 2] = sec.cz - fr.c * dh2 + fr.s * w2; } }
    for (let j = 0; j <= NR; j++) { const j0 = j > 0 ? j - 1 : j, j1 = j < NR ? j + 1 : j;
      for (let i = 0; i < W; i++) { const i0 = i > 0 ? i - 1 : NS - 1, i1 = i < NS ? i + 1 : 1;
        const a = (j * W + i0) * 3, b = (j * W + i1) * 3, c = (j0 * W + i) * 3, d = (j1 * W + i) * 3, k = (j * W + i) * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[d] - pos[c], vy = pos[d + 1] - pos[c + 1], vz = pos[d + 2] - pos[c + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
        if (j === 0 && o < 0.02) { nx = 0; ny = fr.s; nz = -fr.c; nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz; } else { nor[k] = nx / l; nor[k + 1] = ny / l; nor[k + 2] = nz / l; } } }
    pa.needsUpdate = true; na.needsUpdate = true;
  }
  return { mesh, geometry: g, update };
}

// ---------------------------------------------------------------- a small builder: merges plain geometries, a colour and a surface to each
export function makeB() {
  const P = [], N = [], C = [], S = [], I = []; let base = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), nm = new THREE.Matrix3(), col = new THREE.Color();
  return {
    add(geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], c = '#ffffff', surf = 3 } = {}) {
      m4.compose(new THREE.Vector3(...p), q.setFromEuler(e.set(r[0], r[1], r[2])), new THREE.Vector3(...(typeof s === 'number' ? [s, s, s] : s))); nm.getNormalMatrix(m4);
      if (typeof c === 'string') col.set(c); else col.setRGB(c[0], c[1], c[2]);
      const gp = geo.attributes.position, gn = geo.attributes.normal, gi = geo.index;
      for (let i = 0; i < gp.count; i++) { v.fromBufferAttribute(gp, i).applyMatrix4(m4); P.push(v.x, v.y, v.z); v.fromBufferAttribute(gn, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z); C.push(col.r, col.g, col.b); S.push(surf); }
      if (gi) for (let i = 0; i < gi.count; i++) I.push(base + gi.getX(i)); else for (let i = 0; i < gp.count; i++) I.push(base + i);
      base += gp.count; geo.dispose(); return this;
    },
    build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 1)); g.setIndex(I); return g; },
    get count() { return I.length / 3; },
  };
}

// ---------------------------------------------------------------- the basket with its uprights, burner frame and burners (its floor's middle at the origin, y up)
export function basketGeometry() {
  const b = makeB(), WK = '#a06e36', WK2 = '#7a4e24', LE = '#4a2416', ST = '#9aa0a8', RED = '#8a1420';
  b.add(new THREE.BoxGeometry(4.6, 3.3, 3.6), { p: [0, 1.65, 0], c: WK, surf: 1 });
  b.add(new THREE.BoxGeometry(4.68, 0.5, 3.68), { p: [0, 2.35, 0], c: WK2, surf: 1 });                                               // a darker woven band
  for (const s of [-1, 1]) { b.add(new THREE.CylinderGeometry(0.24, 0.24, 5.0, 10), { p: [0, 3.36, s * 1.8], r: [0, 0, Math.PI / 2], c: LE, surf: 3 }); b.add(new THREE.CylinderGeometry(0.24, 0.24, 3.9, 10), { p: [s * 2.3, 3.36, 0], r: [Math.PI / 2, 0, 0], c: LE, surf: 3 }); }   // the padded rim
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(new THREE.CylinderGeometry(0.19, 0.19, 3.3, 8), { p: [sx * 2.3, 1.65, sz * 1.8], c: LE, surf: 3 });     // corners bound in hide
  b.add(new THREE.BoxGeometry(4.5, 0.16, 3.5), { p: [0, -0.02, 0], c: '#94704a', surf: 4 });                                           // the floor: boards
  for (const sz of [-1, 0, 1]) b.add(new THREE.BoxGeometry(4.4, 0.12, 0.3), { p: [0, -0.14, sz * 1.3], c: '#6a4826', surf: 3 });       // battens
  for (const sx of [-1, 1]) b.add(new THREE.BoxGeometry(0.32, 0.3, 4.0), { p: [sx * 1.6, -0.24, 0], c: '#5a3a1c', surf: 3 });          // runners
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add(new THREE.TorusGeometry(0.32, 0.06, 6, 12, Math.PI), { p: [sx * 1.2, 1.55, sz * 1.84], r: [Math.PI, 0, 0], c: '#d8c8a0', surf: 3 });   // rope handles
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.16, 0.16, 2.7, 8), { p: [sx * 1.85, 4.75, sz * 1.5], r: [sz * -0.05, 0, sx * 0.06], c: RED, surf: 3 });   // uprights in their sleeves
    b.add(new THREE.CylinderGeometry(0.42, 0.42, 2.5, 12), { p: [sx * 1.65, 1.6, sz * 1.15], c: ST, surf: 2 });                            // fuel cylinders
  }
  for (const s of [-1, 1]) { b.add(new THREE.BoxGeometry(3.5, 0.2, 0.2), { p: [0, 6.0, s * 1.6], c: ST, surf: 2 }); b.add(new THREE.BoxGeometry(0.2, 0.2, 3.4), { p: [s * 1.65, 6.0, 0], c: ST, surf: 2 }); }
  for (const s of [-1, 1]) { b.add(new THREE.CylinderGeometry(0.42, 0.34, 1.25, 14), { p: [s * 0.55, 6.5, 0], c: ST, surf: 2 }); b.add(new THREE.BoxGeometry(0.3, 0.3, 3.3), { p: [s * 0.55, 6.0, 0], c: '#555b62', surf: 2 });
    for (let k = 0; k < 3; k++) b.add(new THREE.TorusGeometry(0.5, 0.05, 6, 16), { p: [s * 0.55, 6.72 + k * 0.17, 0], r: [Math.PI / 2, 0, 0], c: '#c8a070', surf: 2 }); }   // the burners' coils
  return b.build();
}
// the fan that fills the lying envelope: its cage's middle 2.1 m over the ground, blowing along -z; the blades are a part of their own
export function fanGeometry() {
  const b = makeB(), ST = '#3a3e44', YL = '#c89a18';
  for (const z of [0, 0.9]) { for (const [rr, tt, n] of [[1.75, 0.07, 36], [1.2, 0.035, 28], [0.62, 0.035, 20]]) b.add(new THREE.TorusGeometry(rr, tt, 5, n), { p: [0, 2.1, z], c: ST, surf: 2 });
    for (let i = 0; i < 12; i++) { const a = TAU * i / 12; b.add(new THREE.BoxGeometry(1.5, 0.035, 0.035), { p: [1.0 * Math.cos(a), 2.1 + 1.0 * Math.sin(a), z], r: [0, 0, a], c: ST, surf: 2 }); } }
  for (let i = 0; i < 16; i++) { const a = TAU * i / 16; b.add(new THREE.BoxGeometry(0.05, 0.05, 0.9), { p: [1.75 * Math.cos(a), 2.1 + 1.75 * Math.sin(a), 0.45], c: ST, surf: 2 }); }
  b.add(new THREE.CylinderGeometry(0.4, 0.4, 0.95, 14), { p: [0, 2.1, 1.45], r: [Math.PI / 2, 0, 0], c: '#55595f', surf: 2 });           // the engine, finned
  for (let k = 0; k < 5; k++) b.add(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 14), { p: [0, 2.1, 1.12 + k * 0.16], r: [Math.PI / 2, 0, 0], c: '#787d84', surf: 2 });
  b.add(new THREE.CylinderGeometry(0.28, 0.28, 0.8, 12), { p: [0, 2.86, 1.45], r: [0, 0, Math.PI / 2], c: '#a01818', surf: 3 });           // its tank
  for (const sx of [-1, 1]) { b.add(new THREE.SphereGeometry(0.28, 10, 8), { p: [sx * 0.4, 2.86, 1.45], c: '#a01818', surf: 3 });
    b.add(new THREE.BoxGeometry(0.12, 2.5, 0.12), { p: [sx * 1.42, 1.05, 0.05], r: [0.2, 0, sx * 0.17], c: YL, surf: 3 }); b.add(new THREE.BoxGeometry(0.12, 2.6, 0.12), { p: [sx * 1.42, 1.05, 1.05], r: [-0.34, 0, sx * 0.17], c: YL, surf: 3 });
    b.add(new THREE.BoxGeometry(0.12, 0.12, 2.3), { p: [sx * 1.62, 0.1, 0.6], c: YL, surf: 3 });
    b.add(new THREE.TorusGeometry(0.34, 0.13, 8, 16), { p: [sx * 1.8, 0.47, 1.55], r: [0, Math.PI / 2, 0], c: '#1c1c1e', surf: 3 }); b.add(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 10), { p: [sx * 1.8, 0.47, 1.55], r: [0, 0, Math.PI / 2], c: '#b8bcc0', surf: 2 }); }
  b.add(new THREE.BoxGeometry(3.6, 0.1, 0.1), { p: [0, 0.47, 1.55], c: ST, surf: 2 });                                                     // the axle
  b.add(new THREE.BoxGeometry(2.9, 0.1, 0.1), { p: [0, 3.0, 2.0], c: YL, surf: 3 });                                                       // the handle
  for (const sx of [-1, 1]) b.add(new THREE.BoxGeometry(0.1, 1.5, 0.1), { p: [sx * 1.4, 2.4, 1.7], r: [-0.42, 0, 0], c: YL, surf: 3 });
  return b.build();
}
export function fanBladesGeometry() {
  const b = makeB();
  for (let i = 0; i < 5; i++) { const a = TAU * i / 5; b.add(new THREE.BoxGeometry(1.35, 0.46, 0.04), { p: [0.85 * Math.cos(a), 0.85 * Math.sin(a), 0], r: [0.42, 0, a], c: '#d0d4d8', surf: 2 }); }
  b.add(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12), { r: [Math.PI / 2, 0, 0], c: '#30343a', surf: 2 });
  b.add(new THREE.ConeGeometry(0.25, 0.4, 12), { p: [0, 0, -0.35], r: [-Math.PI / 2, 0, 0], c: '#c89a18', surf: 3 });
  return b.build();
}
// four cables from the burner frame to the mouth's rim: prisms whose ends are set every frame
export function makeCables(mat) {
  const n = 4, pos = new Float32Array(n * 8 * 3), nor = new Float32Array(n * 8 * 3), col = new Float32Array(n * 8 * 3).fill(0.42), sf = new Float32Array(n * 8).fill(3), idx = [];
  for (let k = 0; k < n; k++) { const o = k * 8; for (let i = 0; i < 4; i++) { const a = o + i, b = o + (i + 1) % 4, c = a + 4, d = b + 4; idx.push(a, b, c, b, d, c); } }
  const g = new THREE.BufferGeometry(); const pa = new THREE.BufferAttribute(pos, 3), na = new THREE.BufferAttribute(nor, 3); pa.setUsage(THREE.DynamicDrawUsage); na.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('position', pa); g.setAttribute('normal', na); g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sf, 1)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'cables';
  const d = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0), R = 0.05;
  const set = (k, A, B) => { d.subVectors(B, A).normalize(); p1.crossVectors(d, X); if (p1.lengthSq() < 1e-4) p1.set(0, 1, 0); p1.normalize(); p2.crossVectors(d, p1);
    for (let e = 0; e < 2; e++) { const E = e ? B : A; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, cx = Math.cos(a), sx = Math.sin(a), o = (k * 8 + e * 4 + i) * 3;
      const nx = p1.x * cx + p2.x * sx, ny = p1.y * cx + p2.y * sx, nz = p1.z * cx + p2.z * sx; pos[o] = E.x + nx * R; pos[o + 1] = E.y + ny * R; pos[o + 2] = E.z + nz * R; nor[o] = nx; nor[o + 1] = ny; nor[o + 2] = nz; } }
    pa.needsUpdate = true; na.needsUpdate = true; };
  return { mesh, geometry: g, set };
}

// ---------------------------------------------------------------- another balloon, standing: a lathe of the same form at unit size (its mouth at y 0,
// its basket beneath), 24 gores; uv = (gore, share of the height), the basket's uv.y below zero
export function otherGeometry() {
  const NG = 24, NR = 22, pos = [], nor = [], uv = [], idx = [], W = NG + 1;
  for (let j = 0; j <= NR; j++) { const h = 71.5 * Math.pow(j / NR, 0.9), r = h >= 71.4 ? 0.01 : profR(Math.min(h, 70.9)) * (h > 70.9 ? 0.3 : 1), h2 = Math.min(h + 0.4, 71.5), dr = (h2 >= 71.4 ? 0.01 : profR(Math.min(h2, 70.9))) - r, dh = h2 - h, l = Math.hypot(dr, dh) || 1;
    for (let i = 0; i < W; i++) { const a = TAU * i / NG; pos.push(r * Math.cos(a), h, r * Math.sin(a)); nor.push(dh / l * Math.cos(a), -dr / l, dh / l * Math.sin(a)); uv.push(i, j / NR); } }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NG; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, c, b, b, c, d); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), YU = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const put = (bg, vy) => { const bp = bg.attributes.position, bn = bg.attributes.normal, base = pos.length / 3; for (let i = 0; i < bp.count; i++) { pos.push(bp.getX(i), bp.getY(i), bp.getZ(i)); nor.push(bn.getX(i), bn.getY(i), bn.getZ(i)); uv.push(0, vy); } for (let i = 0; i < bg.index.count; i++) idx.push(base + bg.index.getX(i)); bg.dispose(); };
  const rod = (A, B, w, vy) => { d.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]); const len = d.length(); q.setFromUnitVectors(YU, d.normalize()); m4.compose(new THREE.Vector3((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2), q, one); put(new THREE.BoxGeometry(w, len, w).applyMatrix4(m4), vy); };
  put(new THREE.BoxGeometry(4.6, 3.4, 3.6).translate(0, -13.3, 0), -1);
  put(new THREE.BoxGeometry(5.0, 0.4, 4.0).translate(0, -11.5, 0), -2);
  put(new THREE.BoxGeometry(3.7, 0.3, 3.5).translate(0, -8.6, 0), -2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod([sx * 2.1, -11.5, sz * 1.7], [sx * 1.75, -8.6, sz * 1.65], 0.3, -2);
  for (let k = 0; k < 8; k++) { const a = TAU * (k + 0.5) / 8, c = Math.cos(a), s2 = Math.sin(a); rod([Math.sign(c) * 1.75, -8.6, Math.sign(s2) * 1.65], [8.9 * c, 0.2, 8.9 * s2], 0.22, -2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- the land
// its height: a level meadow about the launch field, rolling ground beyond; from 900 m out wooded foothills in winding ridges, from
// 2,600 m the ranges, high and jagged; all of it lowest toward the sun, and the river keeps a valley of its own right through
const hsh = (i, j) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vnz = (x, z) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz), a = hsh(i, j), b = hsh(i + 1, j), c = hsh(i, j + 1), d = hsh(i + 1, j + 1); return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz; };
const rdg = (x, z) => { const n = 1 - Math.abs(2 * vnz(x, z) - 1); return n * n; };
const SH = Math.hypot(SUN.x, SUN.z), SDX = SUN.x / SH, SDZ = SUN.z / SH;
export function landHeight(x, z) {
  const r = Math.hypot(x, z);
  const roll = Math.sin(x * 0.0061 + 1.3) * Math.cos(z * 0.0047 - 0.4) + 0.5 * Math.sin(x * 0.013 - z * 0.011 + 2.1);
  let h = roll * 7 * sst(r, 380, 1100);
  if (r > 900) {
    const sw = 0.5 + 0.5 * (x * SDX + z * SDZ) / r, dv = Math.abs(z - riverZ(x));
    h += (30 + 200 * rdg(x / 950 + 3.1, z / 950 + 7.7) + 80 * rdg(x / 400 + 1.3, z / 400 + 9.1)) * sst(r, 900, 2300) * (1 - 0.6 * sw) * sst(dv, 60, 560);
    if (r > 2600) h += (180 + 700 * rdg(x / 2300 + 5.2, z / 2300 + 1.7) + 300 * rdg(x / 900 + 2.2, z / 900 + 4.4) + 110 * rdg(x / 380 + 0.4, z / 380 + 8.3)) * sst(r, 2600, 5200) * (1 - 0.78 * sw * sw) * sst(dv, 120, 1200);
  }
  return h;
}
// the land's geometry in rings about the meadow, filled in steps: heights, then normals from the neighbours, then for every vertex
// whether a hill stands between it and the sun (aSh: 1 lit, 0 shaded), found by walking toward the sun over a coarse map of heights
export function makeLand() {
  const NS = 216, rad = [0]; let r = 6; while (r < 7400) { rad.push(r); r = r * 1.045 + 2; }
  const NR = rad.length, W = NS + 1, n = NR * W, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), shd = new Float32Array(n).fill(1), idx = [];
  for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NS; i++) { const a = j * W + i, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('aSh', new THREE.BufferAttribute(shd, 1)); g.setIndex(idx);
  const steps = [];
  for (let j0 = 0; j0 < NR; j0 += 12) steps.push(() => { for (let j = j0; j < Math.min(NR, j0 + 12); j++) for (let i = 0; i < W; i++) { const a = TAU * (i % NS) / NS, x = rad[j] * Math.cos(a), z = rad[j] * Math.sin(a), k = (j * W + i) * 3; pos[k] = x; pos[k + 1] = landHeight(x, z); pos[k + 2] = z; } });
  steps.push(() => { for (let j = 0; j < NR; j++) { const ja = Math.max(j - 1, 0), jb = Math.min(j + 1, NR - 1);
    for (let i = 0; i < W; i++) { const i0 = (i + NS - 1) % NS, i1 = (i + 1) % NS, A = (j * W + i0) * 3, B = (j * W + i1) * 3, C = (ja * W + i) * 3, D = (jb * W + i) * 3, k = (j * W + i) * 3;
      const ux = pos[B] - pos[A], uy = pos[B + 1] - pos[A + 1], uz = pos[B + 2] - pos[A + 2], vx = pos[D] - pos[C], vy = pos[D + 1] - pos[C + 1], vz = pos[D + 2] - pos[C + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; } const l = Math.hypot(nx, ny, nz);
      if (j === 0 || l < 1e-9) { nor[k] = 0; nor[k + 1] = 1; nor[k + 2] = 0; } else { nor[k] = nx / l; nor[k + 1] = ny / l; nor[k + 2] = nz / l; } } } });
  const HN = 256, HS = 6400, HW = HN + 1, hf = new Float32Array(HW * HW), cell = 2 * HS / HN;
  for (let j0 = 0; j0 < HW; j0 += 20) steps.push(() => { for (let j = j0; j < Math.min(HW, j0 + 20); j++) for (let i = 0; i < HW; i++) hf[j * HW + i] = landHeight(-HS + i * cell, -HS + j * cell); });
  const hfAt = (x, z) => { const fx = clamp((x + HS) / cell, 0, HN - 1e-6), fz = clamp((z + HS) / cell, 0, HN - 1e-6), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, o = j * HW + i; return (hf[o] * (1 - u) + hf[o + 1] * u) * (1 - v) + (hf[o + HW] * (1 - u) + hf[o + HW + 1] * u) * v; };
  const tn = SUN.y / SH;
  for (let j0 = 0; j0 < NR; j0 += 24) steps.push(() => { for (let j = j0; j < Math.min(NR, j0 + 24); j++) { if (rad[j] < 300) continue;
    for (let i = 0; i < W; i++) { const k = j * W + i, x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2]; let sh = 1;
      for (let d = 70; d < 5200 && sh > 0; d = d * 1.22 + 30) { const v = 0.5 - (hfAt(x + SDX * d, z + SDZ * d) - (y + d * tn)) / (0.05 * d + 14); if (v < sh) sh = v; }
      shd[k] = clamp(sh, 0, 1); } } });
  return { geometry: g, steps, tris: idx.length / 3 };
}
export const riverZ = (x) => -215 - 45 * Math.sin(x / 150 + 1) - 15 * Math.sin(x / 55 + 0.4);
// the baked map of the land, 4 m to a texel over 4096 m: r the long shadows of trees, g open sky, b the fields' patchwork, a the mist
export function makeLandMap(trees) {
  const S = 1024, data = new Uint8Array(S * S * 4), sh = new Float32Array(S * S);
  const ax = -SUN.x / Math.hypot(SUN.x, SUN.z), az = -SUN.z / Math.hypot(SUN.x, SUN.z), kl = 1 / Math.tan(Math.asin(SUN.y));
  const steps = [];
  // each tree's shadow: a long streak away from the sun
  for (let c0 = 0; c0 < trees.length; c0 += 60) steps.push(() => { for (const t of trees.slice(c0, c0 + 60)) { const len = t.s * 1.5 * kl, wd = t.s * 0.75;
    for (let f = 0; f <= 1; f += 2 / Math.max(len, 2)) { const cx = t.x + ax * len * f, cz = t.z + az * len * f, i0 = Math.floor((cx - wd) / 4 + 512), i1 = Math.ceil((cx + wd) / 4 + 512), j0 = Math.floor((cz - wd) / 4 + 512), j1 = Math.ceil((cz + wd) / 4 + 512);
      for (let j = Math.max(j0, 0); j <= Math.min(j1, S - 1); j++) for (let i = Math.max(i0, 0); i <= Math.min(i1, S - 1); i++) { const dx = (i - 512) * 4 - cx, dz = (j - 512) * 4 - cz, k = 1 - sst(Math.hypot(dx, dz), wd * 0.5, wd * 1.2); const o = j * S + i; sh[o] = Math.max(sh[o], k * (0.86 - 0.3 * f)); } } } });
  for (let band = 0; band < 16; band++) steps.push(() => { for (let j = band * 64; j < band * 64 + 64; j++) for (let i = 0; i < S; i++) { const x = (i - 512) * 4, z = (j - 512) * 4, o = (j * S + i) * 4, r = Math.hypot(x, z);
    const fx = Math.floor((x + 0.35 * z + 2000) / 230), fz = Math.floor((z - 0.2 * x + 2000) / 170), hsh = Math.abs(Math.sin(fx * 127.1 + fz * 311.7) * 43758.5453) % 1;
    const hollow = 0.5 + 0.5 * Math.sin(x * 0.0043 + 0.7) * Math.cos(z * 0.0037 + 1.9);
    data[o] = Math.round(255 * clamp(sh[j * S + i], 0, 1)); data[o + 1] = 255; data[o + 2] = Math.round(255 * (r > 380 ? 0.05 + 0.95 * hsh : 0)); data[o + 3] = Math.round(255 * clamp(sst(hollow, 0.78, 1.0) * sst(r, 260, 700) * 0.8, 0, 1)); } });
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat); tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
  return { tex, steps, done() { tex.needsUpdate = true; } };
}
export function treeGeometry() {
  const b = makeB(), lump = (g, k) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + k * (Math.sin(x * 9.1 + y * 5.3) * Math.sin(z * 7.7 - y * 3.1) + 0.6 * Math.sin(x * 17 + z * 13 + y * 11)); p.setXYZ(i, x * n, y * (1 + 0.5 * (n - 1)), z * n); const l = Math.hypot(x, y, z) || 1; g.attributes.normal.setXYZ(i, x / l, y / l, z / l); } return g; };
  const L = (k, p, s, c) => b.add(lump(new THREE.IcosahedronGeometry(1, 1), k), { p, s, c, surf: 0 });
  L(0.15, [0, 1.15, 0], [0.42, 0.85, 0.42], '#27502a'); L(0.13, [0.03, 2.3, 0.02], [0.28, 0.72, 0.28], '#31602e');                                                  // a poplar
  L(0.17, [1.0, 0.95, 0.3], [0.62, 0.50, 0.62], '#2f5a2a'); L(0.17, [1.46, 0.86, 0.50], [0.44, 0.38, 0.44], '#386630'); L(0.17, [0.66, 1.16, 0.10], [0.44, 0.38, 0.44], '#2a5126');   // a round tree's crown
  L(0.16, [-0.75, 0.36, -0.4], [0.5, 0.38, 0.5], '#28481f');                                                                                                         // a bush
  b.add(new THREE.CylinderGeometry(0.06, 0.1, 0.6, 6), { p: [0, 0.3, 0], c: '#2a1c12', surf: 3 });
  b.add(new THREE.CylinderGeometry(0.07, 0.11, 0.7, 6), { p: [1.0, 0.35, 0.3], c: '#2a1c12', surf: 3 });
  return b.build();
}
// the sun's shaft through the open top: the hole's own outline carried along the sun's rays (standing state)
export function shaftGeometry(st) {
  const NS = 40, NJ = 10, pos = [], nor = [], uv = [], idx = [], W = NS + 1, c = scPoint(0, EV.H, 0, st), m0 = scPoint(0, 0, 0, st), fr = frameOf(st.th), ex = new THREE.Vector3(1, 0, 0), eu = new THREE.Vector3(0, fr.c, fr.s), ax = new THREE.Vector3(0, fr.s, -fr.c), v = new THREE.Vector3(), nn = new THREE.Vector3(), w = new THREE.Vector3();
  // how far each ray runs before it meets the cloth again (never out into the open air)
  const reach = (o) => { let l = 2; for (; l < 70; l += 0.5) { w.copy(o).addScaledVector(SUN, -l).sub(m0); const h = w.dot(ax); if (h < 0.5 || Math.sqrt(Math.max(w.lengthSq() - h * h, 0)) > profR(Math.min(h, EV.H)) - 0.8) break; } return l - 0.5; };
  for (let i = 0; i < W; i++) { const a = TAU * i / NS, rr = EV.HOLE - 0.5; v.copy(c).addScaledVector(ex, rr * Math.cos(a)).addScaledVector(eu, rr * Math.sin(a)); const o = v.clone(), L = reach(o);
    nn.set(0, 0, 0).addScaledVector(ex, Math.cos(a)).addScaledVector(eu, Math.sin(a)); nn.addScaledVector(SUN, -nn.dot(SUN)).normalize();
    for (let j = 0; j <= NJ; j++) { v.copy(o).addScaledVector(SUN, -L * j / NJ); pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); uv.push(i / NS, j / NJ); } }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NJ; j++) { const a = i * (NJ + 1) + j, b = a + 1, c2 = a + NJ + 1, d = c2 + 1; idx.push(a, b, c2, b, d, c2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); return g;
}
