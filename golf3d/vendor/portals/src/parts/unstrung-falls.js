// THE UNSTRUNG FALLS: hero set piece and the beadwork style kit for the world "unstrung-falls".
//
// WHAT IT IS. A pour of loose pearls 24 m wide leaving a notched headwall (lip at y 92), breaking into separate
// tumbling beads, striking a cone of beads, bouncing twice and rolling off as a river; behind the lip a basin heaped
// with pearls creeping to the notch; on the basin rim the Snag, a hooked horn of beadwork; and over the Snag the great
// strand: a broken necklace of 8 m balls of beadwork (every fifth a faceted crystal) on a grey two-ply thread that
// sags 200 m up to a coral-rimmed clasp ring hooked on a pinnacle. Every 6 s the lowest ball slides off the frayed
// tail, falls 35 m turning, bursts on the heap into 1,500 pearls that surge to the lip, and the strand slips a place.
//
// LOCAL FRAME. Origin at river level directly under the middle of the lip; +Y up; the front (the face of the pour)
// looks down +Z, so the river runs away along +Z and the basin, Snag, strand and clasp lie behind at -Z. To seat it in
// the brief's world frame (course along +Z, fall at z 300) use  object.rotation.y = Math.PI; object.position.set(0,0,300)
// so world = (-x, y, 300 - z). opts.mirror flips the piece left to right (Snag on local +X) without mirroring matrices.
//
// THE STYLE, in one routine (see STYLE_GLSL): everything is a bead and is shaded by beadShade(): a flat matte body
// colour, darker at its rim, a pale core stripe along the hole if silver-lined, a dark hole at each pole, and at most
// one soft glint where the surface faces halfway between moon and eye, gated per bead and eased over seconds. Colours
// are written as themselves: the world returns post.flat = 1 (no tone map), so the palette lands on its hex values;
// only glints are written above 1 and only they bloom. No lights, no fog, no shadows. Three tiers of bead:
//   1. impostor beads (beadMaterial): instanced camera-facing quads ray-shaded as true round / cylinder / bugle /
//      crystal beads with their hole and two tones turning; used for loose beads and for the beads that break
//      every silhouette. Under about 4 px they flatten to their body colour and never thin below 2.4 px.
//   2. row surfaces (rowMaterial): meshes whose fragment shader lays beads on a row lattice in metres (rows follow
//      the form: you supply the uv), thread showing in the gaps, one wrong bead per row, puckers; under 4 px a bead
//      becomes the row's flat average. Rows can scroll (heap, pour core, river).
//   3. thread (threadMaterial): two-ply twisted tubes / ribbons held to at least 1.5 px.
//
// EXPORTS for the world coder
//   PALETTE                 the brief's seven hex colours (velvet, midnight, slate, silver, pearl, coral, glint)
//   createStyle(opts)       -> style { uniforms, palette, setExposure(e), setMoon(v3), update(time, renderer),
//                              sceneColor(hex) }: ONE shared uniform set (uTime, uTone, uMoon, uResY, uPal..., uGust)
//   STYLE_GLSL              toScene(), hash, beadShade(), beadOut(), beadRows(), rowFrame(): include in any shader
//   beadQuadGeometry(n)     InstancedBufferGeometry (one quad) for n impostor beads; add your own instanced attributes
//   beadMaterial(style, { header, body, defines })   impostor bead material; `body` is vertex GLSL that sets
//                              C (world centre), R (radius), AX, E1 (unit axis of the hole and a unit vector across it,
//                              world space), LEN (0 round, 0.6 cylinder, 3 bugle), KIND (0 smooth, 1 faceted crystal),
//                              COLA, COLB (display-linear body colours of the two halves), LINED (0..1), SEED
//   rowMaterial(style, { header, vertex, fragment, side })   row-lattice surface; see the comment at the factory
//   threadMaterial(style, { header, body })   twisted thread tube: body sets P (world position), NRM
//   sceneColorFor(hex)      JS side colour -> scene value (the colour itself, under post.flat)
// The hero returns its style as hero.style: build the rest of the world with that same object so one time and one
// moon drive everything.
//
// VALUES ARE GROUPED (round 3). The bastion's face and cheeks are calm dark planes (uDeep with a uNavy zigzag, no pale
// bead; a few slate beads with a lit core beside the pour as wet sheen); the pour is the one bright thing: far off its
// beads are fewer and bigger (a few hundred great pearls before a slate core, coming down to their own size as we come
// near) with a cloud of pearls thrown up at its foot ('foot-spray'). The heap is a dark bed with lanes of creeping pearls.
// opts.light (world direction toward the light) gives every horn a lit side (pearl, silver-lined rows) and a shaded
// side (midnight, slate rows); each ball of the strand has its lit rows, a shaded side of midnight beads and a thin
// silver limb, the change made bead by bead. Dark beads take only a faint glint; beads too small to count take none.
// Row sheets seen at a grazing angle go to their rows' flat tints (GRAZE) instead of foreshortened tiles. Loose beads
// keep out of a cone round the line of sight (keepClear, uCamF). The burst: a quarter of its pearls are a fan thrown
// 12-29 m up (big pearls, slate, silver-lined and crystal among them), the rest run as a surge from the impact, past a
// point 10 m ahead of the eye, to the lip, all of it there 5.4 s after the impact.
// opts.run stages the rare event (the lowest twelve balls crystal; drive it with setRun(t, kick, lift) and setSurge(x)).
// buildHero(ctx, opts): opts.palette (7 hex), opts.detail (0.6-1: thins loose beads and silhouette beads, never the
// strand), opts.moon (unit vector TOWARD the moon, local space), opts.mirror, opts.style (an existing style object
// to share).
// Returned extras: setCycle(t) (seconds into the 6 s drop cycle plus 6*count; null = free-running on time: use it to
// land a drop on the camera's arrival), setGust(x) (0..1 breeze: loose tails and the dangling end swing wider and the bastion's blue beads turn to silver),
// style, lipY, strandPoint(s, out) (local point at arc length s from the frayed tip), strandLength.
// ANCHORS (local space; see the bottom of the file for the list). Size: radius ~190 about centre (0,125,-110),
// height ~250. Cost: about 92k triangles, 14 draw calls, ~290 ms build, no lights, one 256x1 half-float curve texture.
// POST the style assumes (set it on the world): flat 1, exposure 1, bloom { strength 0.3, radius 0.45, threshold 1.0 }
// (pearl sits at luminance 0.87; glints, and the moonlit pearls of the fall written 7% over, are above 1: only they bloom), saturation 1, contrast 1, tint
// white, no vignette, no grain. In the set-piece viewer add &flat=1 to the query.
// EXPECTS AROUND IT: gorge walls meeting the headwall at x = +-40..60 (the headwall here is 150 m wide and 112 m
// high and its ends are unfinished), the river continuing beyond z = +95 (loose beads sink there), a basin rim and
// ridges behind, and the far pinnacle's foot (the pinnacle here is only its top 120 m).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const PALETTE = ['#06070F', '#1B2C66', '#5B6B86', '#C4D2E4', '#F2F0E8', '#E4533F', '#EAF4FF'];

// ---- exact colour: the world returns post.flat = 1 (no tone map), so a palette colour is written as itself and
// lands on its hex; only glints are written above 1, and only they bloom (bloom threshold 1.0) ----
export function sceneColorFor(hex) { return new THREE.Color(hex); }      // post.flat: the linear colour written is the colour shown

// ---- one shared uniform set ----
export function createStyle(opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const thread = pal[2].clone().lerp(pal[3], 0.42);                       // waxed grey: a paler slate
  const uniforms = {
    uTime: { value: 0 }, uTone: { value: 0.6 / (opts.exposure ?? 1.3) }, uResY: { value: 450 },
    uMoon: { value: (opts.moon ? opts.moon.clone() : new THREE.Vector3(0.62, 0.56, -0.55)).normalize() },
    uVelvet: { value: pal[0] }, uBlue: { value: pal[1] }, uSlate: { value: pal[2] }, uSilver: { value: pal[3] },
    uPearl: { value: pal[4] }, uCoral: { value: pal[5] }, uGlint: { value: pal[6] }, uThread: { value: thread },
    uGlintGain: { value: opts.glintGain ?? 1.6 }, uGust: { value: 0 },
    // the two close tones of a calm dark wall: its body (midnight; a deeper frost blue in the frost colourway) and its pattern rows
    uDeep: { value: new THREE.Color(opts.deep ?? pal[1]) }, uNavy: { value: opts.navy ? new THREE.Color(opts.navy) : pal[1].clone().lerp(pal[2], 0.4) },
  };
  const size = new THREE.Vector2();
  const style = {
    uniforms, palette: pal, exposure: opts.exposure ?? 1.3,
    setExposure(e) { style.exposure = e; uniforms.uTone.value = 0.6 / e; },
    setMoon(v) { uniforms.uMoon.value.copy(v).normalize(); },
    update(time, renderer) { uniforms.uTime.value = time; if (renderer) uniforms.uResY.value = renderer.getDrawingBufferSize(size).y; },
    sceneColor(hex) { return sceneColorFor(hex, style.exposure); },
  };
  return style;
}

export const STYLE_GLSL = /* glsl */`
  uniform float uTime, uTone, uResY, uGlintGain, uGust;
  uniform vec3 uMoon, uVelvet, uBlue, uSlate, uSilver, uPearl, uCoral, uGlint, uThread, uDeep, uNavy;
  float hash1(float n){ return fract(sin(n*12.9898 + 4.137)*43758.5453); }
  float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
  // every colour leaves through this: under post.flat the display-linear colour is the scene value
  vec3 toScene(vec3 D){ return max(D, 0.); }
  // THE bead. body: display-linear colour; lined: 0..1 silver lining; n, v, ax, m: unit normal, direction to the eye,
  // axis of the hole, direction to the moon (all in one space); seed: per bead. Returns rgb = display colour, a = glint.
  vec4 beadShade(vec3 body, float lined, vec3 n, vec3 v, vec3 ax, vec3 m, float seed){
    float nv = clamp(dot(n, v), 0., 1.), rim = 1. - nv;
    vec3 c = body*(1. - 0.36*rim*rim);
    vec3 sd = cross(ax, v); float sl = dot(sd, sd);
    float d = abs(dot(n, sd))*inversesqrt(max(sl, 1e-4));
    float stripe = (1. - smoothstep(0.14, 0.34, d))*smoothstep(0.03, 0.25, sl);
    c = mix(c, mix(body, uGlint, 0.8), lined*stripe*0.85);
    c = mix(c, uThread*0.42 + body*0.12, smoothstep(0.925, 0.96, abs(dot(n, ax))));      // the hole: thread seen down it
    vec3 hv = m + v; hv *= inversesqrt(max(dot(hv, hv), 1e-4));
    float tri = abs(fract(seed*13.7 + uTime*0.045)*2. - 1.);
    float g = smoothstep(0.80, 0.97, dot(n, hv))*smoothstep(0.52, 0.78, tri);
    g *= 0.2 + 0.8*smoothstep(0.25, 0.7, dot(body, vec3(0.3333)));      // a dark bead takes a faint glint: only pearl, silver and crystal flash (and bloom)
    return vec4(c, g);
  }
  // display colour + glint -> scene value; the glint is the only thing bright enough to bloom
  vec3 beadOut(vec4 cg){ return toScene(mix(cg.rgb, uGlint, cg.a))*(1. + cg.a*uGlintGain); }
`;

// fragment-only: beads laid in rows on a surface (uses derivatives; never call from inside a loop)
export const ROWS_GLSL = /* glsl */`
  // tangent frame from a continuous uv (metres): T along rows (u), B across (v), both in the space of P and N
  void rowFrame(vec3 P, vec2 uv, vec3 N, out vec3 T, out vec3 B){
    vec3 dpx = dFdx(P), dpy = dFdy(P); vec2 dx = dFdx(uv), dy = dFdy(uv);
    float sg = (dx.x*dy.y - dx.y*dy.x) < 0. ? -1. : 1.;
    vec3 t = (dpx*dy.y - dpy*dx.y)*sg; t -= N*dot(N, t);
    float l = dot(t, t);
    vec3 alt = cross(N, vec3(0.13, 1., 0.21)); alt *= inversesqrt(max(dot(alt, alt), 1e-6));
    T = l > 1e-14 ? t*inversesqrt(l) : alt;
    B = cross(N, T)*sg;
  }
  // g: lattice coordinates in beads (x along the row, y = row). roll < 0: stitched bead, hole along the row.
  // roll >= 0: a loose bead rolling along the row, two tones (colA / colB) turning by angle roll.
  // turn (stitched beads only): 0 shows colA, 1 shows colB, between them the bead is caught turning on its thread.
  // colW: the wrong bead (about one in 22). px: pixels per bead. Returns display rgb + glint.
  vec4 beadRows(vec2 g, vec3 T, vec3 B, vec3 N, vec3 v, vec3 m, vec3 colA, vec3 colB, vec3 colW, float lined, float px, float roll, float turn){
    float row = floor(g.y), col = floor(g.x);
    vec2 f = (fract(g)*2. - 1.)*vec2(1.03, roll >= 0. ? 1.04 : 1.13);
    float seed = hash2(vec2(col, row) + 0.37);
    float wrong = step(hash2(vec2(col*1.7 + 3.1, row*2.3 + 0.7)), 0.045);
    float r2 = dot(f, f);
    vec3 nl = vec3(f, sqrt(max(1. - r2, 0.03)));
    vec3 n = T*nl.x + B*nl.y + N*nl.z; n *= inversesqrt(max(dot(n, n), 1e-6));
    vec3 body = colA, ax = T;
    if (roll >= 0.) {
      float th = roll + seed*6.283; float cs = cos(th), sn = sin(th);
      ax = normalize(B + T*(seed - 0.5)*0.8);
      body = mix(colA, colB, smoothstep(-0.06, 0.06, nl.x*cs + nl.z*sn));
    }
    if (roll < 0. && turn > 0.002) {                                   // a strung two-tone bead turned on its thread
      float th = (min(turn, 1.) - 0.5)*3.14159;
      body = turn > 0.998 ? colB : mix(colA, colB, smoothstep(-0.07, 0.07, nl.y*cos(th) + nl.z*sin(th)));
    }
    body = mix(body, colW, wrong);
    vec4 bead = beadShade(body, lined, n, v, ax, m, seed);
    float aa = 2.4/max(px, 1.);
    float inside = 1. - smoothstep(1. - aa, 1., sqrt(r2));
    vec3 backM = roll >= 0. ? mix(colA, colB, 0.5)*0.5 : uVelvet*1.4 + colA*0.10;
    vec3 back = backM*(roll >= 0. ? 0.8 + 0.4*hash2(vec2(col, row)*1.3 + 5.) : 1.);   // loose: more beads underneath
    vec3 gap = mix(back, uThread*0.9, (1. - smoothstep(0.10, 0.24, abs(f.y)))*step(roll, -0.5));
    vec3 avg = mix(backM, mix(mix(colA, colB, roll >= 0. ? 0.5 : turn), colW, 0.045)*0.9, 0.70);
    float k = smoothstep(3., 6.5, px);
    return vec4(mix(avg, mix(gap, bead.rgb, inside), k), bead.a*inside*k*smoothstep(6., 13., px));      // (beads too small to count keep no glint: a far surface is a soft sheen)
  }
`;

// one quad per bead; add InstancedBufferAttributes of your own and read them in beadMaterial's header/body
export function beadQuadGeometry(count) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

// impostor beads. `body` (vertex GLSL) must set: C, R, AX, E1, LEN, KIND, COLA, COLB, LINED, SEED (see header).
export function beadMaterial(style, { header = '', body = '', uniforms = {}, defines = {} } = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, ...uniforms }, defines, alphaToCoverage: true,
    vertexShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec2 vQ; varying vec3 vAx, vE1, vColA, vColB, vVP; varying vec4 vPar; varying float vPx;
      ${header}
      void main(){
        vec3 C = vec3(0.); float R = 0.5; vec3 AX = vec3(0., 1., 0.), E1 = vec3(1., 0., 0.);
        float LEN = 0., KIND = 0., LINED = 0., SEED = 0.; vec3 COLA = uPearl, COLB = uPearl;
        ${body}
        vec4 mv = viewMatrix*modelMatrix*vec4(C, 1.);
        mat3 nm = mat3(viewMatrix*modelMatrix);
        vec3 ax = nm*AX, e1 = nm*E1;
        float al = length(ax.xy);
        vec2 a2 = al > 1e-3 ? ax.xy/al : vec2(1., 0.);
        float ext = LEN*al;
        float pxr = R*projectionMatrix[1][1]*uResY*0.5/max(-mv.z, 0.05);
        float grow = max(1., 1.2/max(pxr, 1e-3));                 // never thinner than 2.4 px
        vec2 q = position.xy*vec2(1. + ext, 1.);
        mv.xy += (a2*q.x + vec2(-a2.y, a2.x)*q.y)*R*grow;
        vQ = q; vAx = ax; vE1 = e1; vColA = COLA; vColB = COLB; vPar = vec4(ext, KIND, LINED, SEED); vPx = pxr*2.; vVP = mv.xyz;
        vec4 cp = projectionMatrix*mv, cf = projectionMatrix*(mv + vec4(0., 0., R*0.85, 0.));   // depth of the bead's near face
        cp.z = cf.z*cp.w/max(cf.w, 1e-4);
        gl_Position = (R > 1e-4 && cf.w > 0.02) ? cp : vec4(0., 0., 2., 1.);
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec2 vQ; varying vec3 vAx, vE1, vColA, vColB, vVP; varying vec4 vPar; varying float vPx;
      void main(){
        float ext = vPar.x, kind = vPar.y;
        vec3 ax = vAx*inversesqrt(max(dot(vAx, vAx), 1e-6));
        float al = length(ax.xy);
        vec2 a2 = al > 1e-3 ? ax.xy/al : vec2(1., 0.);
        float dx = max(abs(vQ.x) - ext, 0.)*(vQ.x < 0. ? -1. : 1.);
        float r2 = dx*dx + vQ.y*vQ.y;
        float fac = kind > 0.5 ? max(sqrt(r2), abs(vQ.y) + max(abs(dx) - 0.28, 0.)*0.8*al) : sqrt(r2);
        if (fac > 1.) discard;
        vec3 n = vec3(a2*dx + vec2(-a2.y, a2.x)*vQ.y, sqrt(max(1. - r2, 0.)));
        vec3 e1 = vE1 - ax*dot(vE1, ax); e1 *= inversesqrt(max(dot(e1, e1), 1e-6));
        vec3 e2 = cross(ax, e1);
        if (kind > 0.5) {                                          // faceted crystal: 6 facets round, two tiers
          float az = atan(dot(n, e2), dot(n, e1) + 1e-5);
          float aq = (floor(az/1.0472) + 0.5)*1.0472;
          float la = dot(n, ax);
          n = normalize((e1*cos(aq) + e2*sin(aq))*0.80 + ax*(la < 0. ? -0.6 : 0.6));
          n = normalize(mix(n, vec3(0., 0., 1.), 0.15));
        }
        vec3 v = normalize(-vVP);
        vec3 mo = mat3(viewMatrix)*uMoon;
        vec3 body = mix(vColA, vColB, smoothstep(-0.05, 0.05, dot(n, e1)));
        vec4 cg = beadShade(body, vPar.z, n, v, ax, mo, vPar.w);
        if (kind > 0.5) cg.rgb *= 0.86 + 0.2*hash1(floor(atan(dot(n, e2), dot(n, e1) + 1e-5)/1.0472) + vPar.w*7.);
        if (kind > 0.5) cg.a *= 0.6;
        float k = smoothstep(3., 6., vPx);                         // tiny beads: flat body colour, no hole, no glint
        cg = mix(vec4(mix(vColA, vColB, 0.5)*0.9, 0.), cg, k);
        cg.a *= smoothstep(6., 13., vPx);
        gl_FragColor = vec4(beadOut(cg), 1.);
      }`,
  });
  return m;
}

// Row-lattice surface. Vertex snippet may change: P (position), NRM (normal), ROW (vec2 metres: x along the rows,
// y across them; default uv), AUX (vec4 passed on). Fragment snippet may change: uv, PITCH, COLA, COLB, COLW, LINED,
// BRICK (0/1 half-step between rows), TURN (0..1: strung two-tone beads turned from COLA to COLB, for the gust
// front that sweeps a cliff from blue to silver), and for loose rows SCROLL (metres travelled along +x), SHEAR (lane speed
// spread), ROLL (>= 0: rolling two-tone beads), FLAT (0..1: push toward the row average, for fast or far surfaces).
// DARK (0..1): where the rows are too fine to draw, show dark backing cloth instead of the row average (for sheets
// that lie under impostor beads), or FARC if you set it (the pour's core goes to clean pearl far off: one white stroke).
export function rowMaterial(style, { header = '', vertex = '', fragHeader = '', fragment = '', uniforms = {}, side = THREE.FrontSide } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, ...uniforms }, side,
    vertexShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vVP, vVN, vWP; varying vec2 vRow; varying vec4 vAux;
      ${header}
      void main(){
        vec3 P = position, NRM = normal; vec2 ROW = uv; vec4 AUX = vec4(0.);
        ${vertex}
        vec4 wp = modelMatrix*vec4(P, 1.); vec4 mv = viewMatrix*wp;
        vVP = mv.xyz; vWP = P; vVN = mat3(viewMatrix*modelMatrix)*NRM; vRow = ROW; vAux = AUX;
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      ${ROWS_GLSL}
      varying vec3 vVP, vVN, vWP; varying vec2 vRow; varying vec4 vAux;
      ${fragHeader}
      void main(){
        vec3 N = vVN*inversesqrt(max(dot(vVN, vVN), 1e-8)); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(-vVP), M = mat3(viewMatrix)*uMoon;
        vec2 uv = vRow; vec4 AUX = vAux;
        float PITCH = 1.2, SCROLL = 0., SHEAR = 0., ROLL = -1., LINED = 0., FLAT = 0., BRICK = 1., TURN = 0., DARK = 0., GLINT = 1.;
        vec3 FARC = uVelvet*1.6 + uBlue*0.22;
        vec3 COLA = uBlue, COLB = uSilver, COLW = uSlate;
        // GRAZE: 1 seen square on, 0 at a grazing angle, where a sheet's beads would be foreshortened into flat tiles
        vec2 ja = dFdx(vRow), jb = dFdy(vRow);
        float GRAZE = smoothstep(0.28, 0.55, abs(ja.x*jb.y - ja.y*jb.x)/max(max(dot(ja, ja), dot(jb, jb)), 1e-9));
        ${fragment}
        vec3 T, B; rowFrame(vVP, uv, N, T, B);
        vec2 fw = fwidth(uv); float px = PITCH/max(max(fw.x, fw.y), 1e-5);
        // a sheet seen at a grazing angle would show its beads foreshortened into flat tiles: there it goes to its rows'
        // flat tints instead (and the loose and real beads that lie on it carry the picture)
        float graze = GRAZE;
        FLAT = 1. - (1. - FLAT)*graze;
        vec2 g = uv/PITCH; float row = floor(g.y);
        float sp = SCROLL*(1. + SHEAR*(hash1(row) - 0.5))/PITCH;
        g.x += 0.5*mod(row, 2.)*BRICK + (ROLL >= 0. ? hash1(row + 9.) : 0.) - sp;
        vec4 cg = beadRows(g, T, B, N, V, M, COLA, COLB, COLW, LINED, px*(1. - FLAT), ROLL < 0. ? -1. : sp*2., TURN);
        // DARK: a sheet that lies under impostor beads shows dark backing cloth wherever its own rows are too fine to draw
        cg.rgb = mix(cg.rgb, FARC, DARK*(1. - smoothstep(3., 6.5, px*(1. - FLAT))));
        // a bead of a sheet seen at a grazing angle is foreshortened flat: it keeps no glint (no white ovals on a floor)
        cg.a *= GLINT*graze;
        gl_FragColor = vec4(beadOut(cg), 1.);
      }`,
  });
}

// Twisted two-ply thread on a tube (uv.x = metres along, uv.y = 0..1 round). Vertex snippet sets CEN (the centre of
// the tube at this vertex), NRM (unit, outward) and RAD; the tube is widened so it never drops under 1.5 px.
export function threadMaterial(style, { header = '', body = '', uniforms = {}, twist = 0.55, tone = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...style.uniforms, ...uniforms },
    vertexShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec2 vUv; varying vec3 vVN, vVP;
      ${header}
      void main(){
        vec3 CEN = position, NRM = normal; float RAD = 0.25;
        ${body}
        vec4 mc = viewMatrix*modelMatrix*vec4(CEN, 1.);
        float minR = 0.8*max(-mc.z, 0.05)/(projectionMatrix[1][1]*uResY*0.5);
        vec3 n = mat3(viewMatrix*modelMatrix)*NRM;
        vec4 mv = mc + vec4(n*max(RAD, minR), 0.);
        vUv = uv; vVN = n; vVP = mv.xyz;
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec2 vUv; varying vec3 vVN, vVP;
      void main(){
        vec3 n = vVN*inversesqrt(max(dot(vVN, vVN), 1e-8)); vec3 v = normalize(-vVP);
        float ph = vUv.y*2. + vUv.x*${twist.toFixed(3)};
        float w = fwidth(ph);
        float ply = abs(fract(ph)*2. - 1.);                                   // 0 in the groove between plies
        float groove = mix(0.82, smoothstep(0.0, 0.5, ply)*0.42 + 0.58, 1. - smoothstep(0.25, 0.6, w));
        float nv = clamp(dot(n, v), 0., 1.);
        vec3 c = uThread*${tone.toFixed(3)}*groove*(0.72 + 0.28*nv);
        gl_FragColor = vec4(toScene(c), 1.);
      }`,
  });
}

// thread along a polyline: positions are the CENTRE line (the material pushes them out along the normal), aRad.x the
// radius and aRad.y how far the far end swings (metres); use with threadMaterial(style, TAIL_THREAD)
export function threadTubeGeometry(points, radius = 0.2, sides = 5, closed = false, swing = 0) {
  const c = new THREE.CatmullRomCurve3(points, closed, 'centripetal'), L = c.getLength(), segs = Math.max(3, Math.round(L / Math.max(radius * 5, 0.8)));
  const fr = c.computeFrenetFrames(segs, closed), pos = [], nor = [], uv = [], rad = [], idx = [], p = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    c.getPointAt(i / segs, p);
    for (let k = 0; k <= sides; k++) {
      const a = k / sides * Math.PI * 2, n = fr.normals[i], b = fr.binormals[i];
      pos.push(p.x, p.y, p.z); nor.push(n.x * Math.cos(a) + b.x * Math.sin(a), n.y * Math.cos(a) + b.y * Math.sin(a), n.z * Math.cos(a) + b.z * Math.sin(a));
      uv.push(i / segs * L, k / sides); rad.push(radius, swing * (i / segs) ** 2);
    }
  }
  for (let i = 0; i < segs; i++) for (let k = 0; k < sides; k++) { const q = i * (sides + 1) + k, r = q + sides + 1; idx.push(q, r, q + 1, q + 1, r, r + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aRad', new THREE.Float32BufferAttribute(rad, 2)); g.setIndex(idx);
  return g;
}
export const TAIL_THREAD = { header: 'attribute vec2 aRad;', body: /* glsl */`
  RAD = aRad.x;
  CEN = position + vec3(sin(uTime*0.63 + position.y*0.07), 0., cos(uTime*0.51 + position.x*0.09))*aRad.y*(1. + 1.5*uGust);` };
// flat dark backing under impostor beads (cloth / thread seen in the gaps); expr is a display-linear GLSL colour
export function backingMaterial(style, expr = 'uThread*0.42', side = THREE.FrontSide) {
  return new THREE.ShaderMaterial({ uniforms: style.uniforms, side,
    vertexShader: `varying vec3 vN, vP; void main(){ vec4 mv = modelViewMatrix*vec4(position, 1.); vN = normalMatrix*normal; vP = mv.xyz; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `${STYLE_GLSL} varying vec3 vN, vP; void main(){ float nv = abs(dot(vN*inversesqrt(max(dot(vN, vN), 1e-8)), normalize(-vP)));
      gl_FragColor = vec4(toScene((${expr})*(0.62 + 0.38*nv)), 1.); }` });
}

// ---- the great strand: a curve by arc length in a 256x1 half-float texture, swayed in the vertex shader ----
const NS = 256, CURVE_K = 160, BALL_R = 4, BALL_PITCH = 8.6, S0 = 9, SLOTS = 28, CYCLES = 12, DROP_T = 6;
const STRAND_GLSL = /* glsl */`
  uniform sampler2D uCurve; uniform float uSLen, uRunH; uniform vec3 uCurveC, uSpanN, uDangA;
  uniform vec4 uRun;         // the rare run. x: 1 = staged (the lowest twelve are crystal), y: seconds since the thread jerked (< 0 before), z: the jerk's kick (m), w: lift of the lightened span (m)
  vec3 strandAt(float s){
    float u = clamp(s/uSLen, 0., 1.);
    vec4 t = textureLod(uCurve, vec2(u*${((NS - 1) / NS).toFixed(6)} + ${(0.5 / NS).toFixed(6)}, 0.5), 0.);
    vec3 p = t.xyz*${CURVE_K.toFixed(1)} + uCurveC;
    float sw = max(t.w, 0.), dw = max(-t.w, 0.);
    p += uSpanN*(sw*(sin(uTime*0.42 + s*0.012)*2.6 + sin(uTime*0.23 + 1.7)*1.2));
    p.y += sw*sin(uTime*0.31 + s*0.02)*0.8;
    float ph = uTime*0.628 - dw*0.9;
    p += uDangA*((sin(ph) + 0.4*sin(ph*2.3 + 1.3))*dw*dw*(2.2 + 3.*uGust) + uRun.z*dw*dw);
    p.y += uRun.w*sw;
    return p;
  }
  // frame at s: t along the thread, b1/b2 across
  void strandFrame(float s, out vec3 c, out vec3 t, out vec3 b1, out vec3 b2){
    c = strandAt(s);
    vec3 d = strandAt(s + 2.) - strandAt(s - 2.);
    t = d*inversesqrt(max(dot(d, d), 1e-6));
    vec3 r = cross(t, vec3(1., 0., 0.02)); b1 = r*inversesqrt(max(dot(r, r), 1e-6)); b2 = cross(t, b1);
  }
  uniform vec4 uDrop;        // x: metres slid down the tail, y: metres fallen, z: 1 while the lowest ball exists, w: turn
  uniform vec4 uSlip;        // x: slip 0..1, y: highest strung slot, z: feed offset for slots above it, w: balls gone
  uniform vec3 uRelease;     // where the lowest ball left the thread
  // centre and frame of ball slot i; returns its scale (0 = not there)
  float ballFrame(float i, out vec3 c, out vec3 t, out vec3 b1, out vec3 b2){
    float s = ${S0.toFixed(1)} + (i - uSlip.x)*${BALL_PITCH.toFixed(2)};
    float sc = 1., fallR = 0.;
    bool run = uRun.x > 0.5 && uRun.y > 0. && i < 11.5;       // the run: the lowest twelve slide off the frayed end in one train
    if (run) {
      float need = i*${BALL_PITCH.toFixed(2)} + 7.4, ti = sqrt(need/6.5);
      s = ${S0.toFixed(1)} + i*${BALL_PITCH.toFixed(2)} - min(6.5*uRun.y*uRun.y, need);
      if (uRun.y > ti) { float tf = uRun.y - ti; fallR = min(13.*ti, 20.)*tf + 4.9*tf*tf; if (fallR > uRunH) sc = 0.; }
    }
    else if (i < 0.5) { s = ${S0.toFixed(1)} - uDrop.x; sc = uDrop.z; }
    else if (i > uSlip.y + 0.5) s += uSlip.z;
    sc *= 1. - smoothstep(uSLen - 11., uSLen - 5., s);
    strandFrame(s, c, t, b1, b2);
    float a = i*2.4 + uSlip.w*2.4 + sin(uTime*0.21 + i*1.7)*0.2;
    if (run) { c.y -= fallR; float w = fallR*0.06, cw = cos(w), sw = sin(w); vec3 t2 = t*cw + b2*sw; b2 = b2*cw - t*sw; t = t2; }
    else {
      if (i < 0.5 && uDrop.y > 0.) { c = uRelease + vec3(0., -uDrop.y, 0.); }
      if (i < 0.5) {                                              // the falling ball turns slowly about a level axis
        float w = uDrop.w, cw = cos(w), sw = sin(w);
        vec3 t2 = t*cw + b2*sw; b2 = b2*cw - t*sw; t = t2;
      }
    }
    float ca = cos(a), sa = sin(a);
    vec3 x1 = b1*ca + b2*sa; b2 = b2*ca - b1*sa; b1 = x1;
    return sc;
  }
`;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const SX = opts.mirror ? -1 : 1;
  const style = opts.style || createStyle({ palette: opts.palette, exposure: opts.exposure ?? 1.3, moon: opts.moon });
  const root = new THREE.Group(); root.name = 'unstrung-falls-hero';
  const V3 = THREE.Vector3;
  // per-seed variety (all draws up front, in a fixed order)
  const vr = {
    lipW: 24 * rng.range(0.92, 1.1), sagY: 150 + rng.range(-4, 4), claspX: 60 + rng.range(-7, 7), claspY: 236 + rng.range(-5, 5),
    phase0: rng.int(0, 4), hook: rng.range(0.75, 1.25), lean: rng.range(-1, 1), coneH: 26 * rng.range(0.92, 1.1),
    dangX: rng.range(5, 9), heapSeed: rng.range(0, 100), wallSeed: rng.range(0, 100), ringTurn: rng.range(0, 6.28),
  };
  const LIP_Y = 92, LIP_W = vr.lipW;
  // the light (opts.light: world direction toward it; this piece is seated turned half round, so local = (-x, y, -z)):
  // every horn and spire has a lit side (pearl and silver-lined rows) and a shaded side (midnight and slate)
  const LL = opts.light ? new THREE.Vector3(-opts.light.x, opts.light.y, -opts.light.z).normalize() : null;

  // -- curve: frayed tip -> over the Snag -> sag -> clasp ring --
  const snagTip = new V3(-34 * SX, 160, -115);
  const top = snagTip.clone(); top.y += 1.6;
  const ringC = new V3(vr.claspX * SX, vr.claspY, -290);
  const hd = new V3(ringC.x - top.x, 0, ringC.z - top.z).normalize();
  // the ring's axis = the final 30 degree climb. It is turned 16 degrees in plan toward the side the camera flies on, so
  // the approach comes in from the strand's left and the thread and its last balls rise to the ring from the lower right
  // of the frame instead of hiding straight under the mount.
  const AX_TURN = 16 * Math.PI / 180, hdA = hd.clone().multiplyScalar(Math.cos(AX_TURN)).addScaledVector(new V3(hd.z, 0, -hd.x), -Math.sin(AX_TURN));
  const ringA = new V3(hdA.x * 0.866, 0.5, hdA.z * 0.866).normalize();
  const ringUp = new V3(0, 1, 0).addScaledVector(ringA, -ringA.y).normalize();
  const ringSide = new V3().crossVectors(ringUp, ringA).normalize();
  const tie = ringC.clone().addScaledVector(ringUp, -10.4);
  const Dh = Math.hypot(tie.x - top.x, tie.z - top.z), dMin = 44.7;
  const yAt = (d) => (d < dMin ? vr.sagY + (top.y - vr.sagY) * ((dMin - d) / dMin) ** 2 : vr.sagY + (tie.y - vr.sagY) * ((d - dMin) / (Dh - dMin)) ** 1.8);
  const cp = [];
  for (const o of [[vr.dangX + 3, -38, 21], [vr.dangX + 2.6, -24, 20], [vr.dangX + 1.4, -11, 17], [5.5, -1.6, 9.5]]) cp.push(new V3(top.x + o[0] * SX, top.y + o[1], top.z + o[2]));
  cp.push(top.clone());
  for (const d of [12, 27, dMin, 70, 100, 130, 165]) cp.push(new V3(top.x + hd.x * d, yAt(d), top.z + hd.z * d));
  cp.push(tie.clone());
  const curve = new THREE.CatmullRomCurve3(cp, false, 'centripetal'); curve.arcLengthDivisions = 600;
  const sp = curve.getSpacedPoints(NS - 1), SLEN = curve.getLength();
  const LIM0 = Math.min(SLOTS - 1, Math.floor((SLEN - 12.5 - S0) / BALL_PITCH));   // the highest slot strung when the strand is whole: balls to within a few metres of the clasp
  await ctx.yield();
  let jTop = 0, best = 1e9; for (let j = 0; j < NS; j++) { const d = sp[j].distanceToSquared(top); if (d < best) { best = d; jTop = j; } }
  const sTop = jTop / (NS - 1) * SLEN;
  const curveC = new V3(0, 180, -200), wgt = new Float32Array(NS), half = new Uint16Array(NS * 4);
  for (let j = 0; j < NS; j++) {
    const s = j / (NS - 1) * SLEN;
    wgt[j] = s < sTop ? -((sTop - s) / sTop) : Math.sin(Math.PI * (s - sTop) / (SLEN - sTop));
    half[j * 4] = THREE.DataUtils.toHalfFloat((sp[j].x - curveC.x) / CURVE_K); half[j * 4 + 1] = THREE.DataUtils.toHalfFloat((sp[j].y - curveC.y) / CURVE_K);
    half[j * 4 + 2] = THREE.DataUtils.toHalfFloat((sp[j].z - curveC.z) / CURVE_K); half[j * 4 + 3] = THREE.DataUtils.toHalfFloat(wgt[j]);
  }
  const curveTex = new THREE.DataTexture(half, NS, 1, THREE.RGBAFormat, THREE.HalfFloatType);
  curveTex.minFilter = curveTex.magFilter = THREE.LinearFilter; curveTex.wrapS = curveTex.wrapT = THREE.ClampToEdgeWrapping; curveTex.needsUpdate = true;
  const spanN = new V3(-hd.z, 0, hd.x), dangA = new V3(0.8 * SX, 0, 0.6).normalize();
  const SU = {
    uCurve: { value: curveTex }, uSLen: { value: SLEN }, uCurveC: { value: curveC }, uSpanN: { value: spanN }, uDangA: { value: dangA },
    uDrop: { value: new THREE.Vector4(0, 0, 1, 0) }, uSlip: { value: new THREE.Vector4(0, LIM0, 1e4, vr.phase0) }, uRelease: { value: new V3() },
    uRun: { value: new THREE.Vector4(opts.run ? 1 : 0, -1, 0, 0) }, uRunH: { value: 30 },
  };
  const U = style.uniforms;
  // the same curve on the CPU (time < 0: at rest)
  function strandPoint(s, out = new V3(), time = -1) {
    const f = clamp(s / SLEN, 0, 1) * (NS - 1), j = Math.min(NS - 2, Math.floor(f)), k = f - j;
    out.lerpVectors(sp[j], sp[j + 1], k);
    if (time >= 0) {
      const w = lerp(wgt[j], wgt[j + 1], k), sw = Math.max(w, 0), dw = Math.max(-w, 0);
      out.addScaledVector(spanN, sw * (Math.sin(time * 0.42 + s * 0.012) * 2.6 + Math.sin(time * 0.23 + 1.7) * 1.2));
      out.y += sw * Math.sin(time * 0.31 + s * 0.02) * 0.8;
      const ph = time * 0.628 - dw * 0.9;
      out.addScaledVector(dangA, (Math.sin(ph) + 0.4 * Math.sin(ph * 2.3 + 1.3)) * dw * dw * (2.2 + 3 * U.uGust.value));
    }
    return out;
  }

  // -- the balls of the strand: rings of impostor beads round the thread, over a dark backing ball --
  {
    const RINGS = 16, RB = BALL_R - 0.4, per = [];
    for (let j = 0; j < RINGS; j++) {
      const lat = (-0.5 + (j + 0.5) / RINGS) * Math.PI, nb = Math.max(5, Math.round(2 * Math.PI * RB * Math.cos(lat) / 0.83));
      for (let k = 0; k < nb; k++) { const a = (k + (j % 2) * 0.5) / nb * Math.PI * 2; per.push([Math.cos(lat) * Math.cos(a), Math.sin(lat), Math.cos(lat) * Math.sin(a), j]); }
    }
    const n = per.length * SLOTS, aO = new Float32Array(n * 3), aI = new Float32Array(n * 4);
    let q = 0;
    for (let i = 0; i < SLOTS; i++) {
      const wrongA = rng.int(0, per.length - 1), wrongB = rng.chance(0.5) ? rng.int(0, per.length - 1) : -1, puck = rng.chance(0.4) ? rng.int(3, RINGS - 4) : -1;
      for (let b = 0; b < per.length; b++, q++) {
        const p = per[b];
        aO[q * 3] = p[0]; aO[q * 3 + 1] = p[1]; aO[q * 3 + 2] = p[2];
        // (round 6: where the thread enters, each ball wears a cap of coral seeds, and the next row is coral and pearl by turns: the necklace's clasps, the flight's one warm accent)
        const pole = p[3] < 1 || p[3] > RINGS - 2, sub = p[3] === 1 || p[3] === RINGS - 2, cap = pole || (sub && b % 2 === 0) ? 4 : (p[3] === 7 || p[3] === 8 ? 3 : 0);
        aI[q * 4] = i; aI[q * 4 + 1] = (b === wrongA || b === wrongB) ? 1 : cap; aI[q * 4 + 2] = rng(); aI[q * 4 + 3] = p[3] === puck ? 0.93 : 1;
      }
      if (i % 6 === 5) await ctx.yield();
    }
    const g = beadQuadGeometry(n);
    g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 3)); g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
    const m = beadMaterial(style, { uniforms: SU, header: STRAND_GLSL + 'attribute vec3 aO; attribute vec4 aI;', body: /* glsl */`
      vec3 bc, t, b1, b2; float sc = ballFrame(aI.x, bc, t, b1, b2);
      vec3 o = b1*aO.x + t*aO.y + b2*aO.z;
      C = bc + o*(${RB.toFixed(2)}*aI.w*sc); R = 0.43*sc;
      R *= smoothstep(1.0, 1.7, 0.86*projectionMatrix[1][1]*uResY*0.5/max(-(viewMatrix*modelMatrix*vec4(bc, 1.)).z, 0.05));   // too far to count: the ball's disc stands in
      vec3 tr = cross(t, o); AX = tr*inversesqrt(max(dot(tr, tr), 1e-5)); E1 = o;
      float cry = max(step(mod(aI.x + uSlip.w + 0.5, 5.), 1.), uRun.x*step(aI.x, 11.5));
      KIND = cry; LINED = cry; SEED = aI.z + aI.x*0.137;
      float cor = step(3.5, aI.y);
      vec3 pearlRow = aI.y > 2.5 ? uSilver : (aI.y > 1.5 ? uSlate : (aI.y > 0.5 ? uBlue : uPearl));
      vec3 cryRow = aI.y > 1.5 ? mix(uSilver, uGlint, 0.5) : (aI.y > 0.5 ? uPearl : uSilver);
      COLA = mix(mix(pearlRow, cryRow, cry), uCoral, cor); COLB = COLA; LINED = max(LINED, step(2.5, aI.y))*(1. - cor); KIND *= 1. - cor;
      // moonlight: each ball has a lit side (its own rows) and a shaded side (midnight beads; slate on a crystal), the
      // change made bead by bead, and a thin silver rim of beads round its limb
      vec3 ow = mat3(modelMatrix)*o; ow *= inversesqrt(max(dot(ow, ow), 1e-6));
      vec3 vd = (modelMatrix*vec4(bc, 1.)).xyz - cameraPosition; vd *= inversesqrt(max(dot(vd, vd), 1e-6));
      float lit = max(step(fract(aI.z*7.31 + 0.13), smoothstep(-0.7, -0.3, dot(ow, uMoon))), cor);
      float limb = step(abs(dot(ow, vd)), 0.2)*(1. - lit);
      cry *= 1. - cor;
      vec3 shade = mix(uDeep, uSlate, cry);
      COLA = mix(mix(shade, uSilver, limb), COLA, lit); COLB = COLA; LINED = max(LINED*lit, limb); KIND *= max(lit, 1. - cry);` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'strand-beads'; root.add(mesh);
    // backing balls
    const ico = new THREE.IcosahedronGeometry(BALL_R - 0.62, 2), bg = new THREE.InstancedBufferGeometry();
    bg.setAttribute('position', ico.getAttribute('position')); if (ico.index) bg.setIndex(ico.index);
    const slot = new Float32Array(SLOTS); for (let i = 0; i < SLOTS; i++) slot[i] = i;
    bg.setAttribute('aSlot', new THREE.InstancedBufferAttribute(slot, 1)); bg.instanceCount = SLOTS; bg.boundingSphere = new THREE.Sphere(new V3(), 1e5);
    const bm = new THREE.ShaderMaterial({ uniforms: { ...U, ...SU },
      vertexShader: `${STYLE_GLSL}${STRAND_GLSL} attribute float aSlot; varying vec3 vN, vP, vRim; varying float vCry, vFar;
        void main(){ vec3 bc, t, b1, b2; float sc = ballFrame(aSlot, bc, t, b1, b2); vec3 o = b1*position.x + t*position.y + b2*position.z;
          // distance makes beads bigger and fewer: from the river, through the notch, every third ball stands for three,
          // so the strand over the lip is a row of separate pale discs on its thread; the rest grow in as we come up the gorge
          float dfar = smoothstep(300., 380., length((viewMatrix*modelMatrix*vec4(bc, 1.)).xyz));
          sc *= mod(floor(aSlot - uSlip.x + 0.5) + 2., 3.) > 0.5 ? 1. - dfar : 1. + 0.35*dfar;
          vFar = 1. - smoothstep(1.0, 1.7, 0.86*projectionMatrix[1][1]*uResY*0.5/max(-(viewMatrix*modelMatrix*vec4(bc, 1.)).z, 0.05));
          vec4 mv = viewMatrix*modelMatrix*vec4(bc + o*sc*(1. + ${(0.62 / (BALL_R - 0.62)).toFixed(3)}*vFar), 1.);
          vRim = (mv.xyz - (viewMatrix*modelMatrix*vec4(bc, 1.)).xyz)/(${BALL_R.toFixed(1)}*max(sc, 0.3));      /* across the ball's disc, -1..1 */
          vec3 ow = mat3(modelMatrix)*o; vRim.z = dot(ow*inversesqrt(max(dot(ow, ow), 1e-6)), uMoon);     /* the moon's side of the ball */
          vN = mat3(viewMatrix*modelMatrix)*o; vP = mv.xyz; vCry = max(step(mod(aSlot + uSlip.w + 0.5, 5.), 1.), uRun.x*step(aSlot, 11.5));
          gl_Position = sc > 0.01 ? projectionMatrix*mv : vec4(0., 0., 2., 1.); }`,
      fragmentShader: `${STYLE_GLSL} varying vec3 vN, vP, vRim; varying float vCry, vFar;
        void main(){ float nv = clamp(dot(vN*inversesqrt(max(dot(vN, vN), 1e-8)), -vP*inversesqrt(max(dot(vP, vP), 1e-8))), 0., 1.);
          // far off a ball is one pale disc with a darker rim, so a row of them reads as beads on a thread
          vec3 disc = mix(uPearl, mix(uSilver, uGlint, 0.5), vCry)*(1. - 0.5*smoothstep(0.55, 0.98, length(vRim.xy)));
          disc = mix(mix(uDeep, uSlate, vCry), disc, smoothstep(-0.56, -0.44, vRim.z));                         // its shaded side
          gl_FragColor = vec4(toScene(mix(mix(uThread*0.5, uSlate*0.62, vCry)*(0.6 + 0.4*nv), disc, clamp(vFar, 0., 1.))), 1.); }` });
    const back = new THREE.Mesh(bg, bm); back.frustumCulled = false; back.name = 'strand-backing'; root.add(back); ico.dispose();
  }
  await ctx.yield();

  // -- the thread: a two-ply tube from the frayed tip to the clasp, and five frayed fibres at the tail --
  {
    const pos = [], uv = [], aT = [], idx = [];
    const tube = (s0, s1, segs, sides, fray) => {
      const base = pos.length / 3;
      for (let i = 0; i <= segs; i++) for (let k = 0; k <= sides; k++) {
        const s = lerp(s0, s1, i / segs), a = k / sides * Math.PI * 2;
        pos.push(s, a, fray); uv.push(s, k / sides); aT.push(s, a, fray);
      }
      for (let i = 0; i < segs; i++) for (let k = 0; k < sides; k++) { const a = base + i * (sides + 1) + k, b = a + sides + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    };
    tube(3.5, SLEN, 250, 6, 0);
    for (let f = 1; f <= 5; f++) tube(0, 6.5 - f * 0.5, 9, 3, f);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 3)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new V3(), 1e5);
    const m = threadMaterial(style, { uniforms: SU, header: STRAND_GLSL + 'attribute vec3 aT;', body: /* glsl */`
      vec3 c, t, b1, b2; strandFrame(aT.x, c, t, b1, b2);
      RAD = 0.26;
      if (aT.z > 0.5) {
        float k = 1. - aT.x/6.5, a = aT.z*1.9 + 0.4;
        c += (b1*cos(a) + b2*sin(a))*(k*k*(0.55 + 0.3*sin(uTime*0.8 + aT.z*2.1)) + 0.12) + t*(k*k*0.4*sin(aT.z*5.));
        RAD = 0.08;
      }
      CEN = c; NRM = b1*cos(aT.y) + b2*sin(aT.y);` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'strand-thread'; root.add(mesh);
  }
  await ctx.yield();

  // -- fixed impostor beads (clasp ring, Snag, pinnacle, rims): pushed into one instanced set --
  const FB = { p: [], ax: [], k: [] };      // centre + radius | hole axis | colour index, shape (0 round, 1 crystal, 2 cylinder), seed, lined
  const fixedBead = (x, y, z, r, ax, ay, az, col, shape, lined = 0) => { FB.p.push(x, y, z, r); FB.ax.push(ax, ay, az); FB.k.push(col, shape, rng(), lined); };
  const tmpA = new V3(), tmpB = new V3(), tmpC = new V3();
  // a horn: rings of beads round a centre line (rows follow the form); returns the backing tube geometry
  function horn(pts, r0, r1, pitch, colourOf, backR = 0.75) {
    const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), L = c.getLength(), rows = Math.max(4, Math.round(L / (pitch * 0.9)));
    const fr = c.computeFrenetFrames(rows, false), prof = (t) => lerp(r0, r1, t ** 0.8) * (1 + 0.1 * Math.sin(t * 17 + r0));
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, r = prof(t), nb = Math.max(4, Math.round(2 * Math.PI * r / pitch));
      c.getPointAt(t, tmpA);
      const wrong = rng.int(0, nb - 1), tight = rng.chance(0.12) ? 0.9 : 1;
      for (let k = 0; k < nb; k++) {
        const a = (k + (i % 2) * 0.5) / nb * Math.PI * 2;
        tmpB.copy(fr.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(fr.binormals[i], Math.sin(a));
        tmpC.crossVectors(fr.tangents[i], tmpB);
        const col = colourOf(i, k, rows, k === wrong);
        if (LL) {
          const lit = tmpB.dot(LL) + 0.22 * (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453 % 1) > 0.12;      // the terminator is made bead by bead
          if (lit) { if (col[0] === 0) { col[0] = 3; col[2] = 0; } else if (col[0] === 3) { col[0] = 2; col[2] = 1; } }
          else if (col[0] === 2 || col[0] === 3) { col[0] = 1; col[2] = 0; }
        }
        fixedBead(tmpA.x + tmpB.x * r * tight, tmpA.y + tmpB.y * r * tight, tmpA.z + tmpB.z * r * tight, pitch * 0.5, tmpC.x, tmpC.y, tmpC.z, col[0], col[1], col[2]);
      }
    }
    const geo = new THREE.TubeGeometry(c, rows, 1, 10, false), gp = geo.getAttribute('position'), gn = geo.getAttribute('normal');
    for (let i = 0; i < gp.count; i++) { const t = Math.floor(i / 11) / rows, r = prof(t) - pitch * backR * 0.5; gp.setXYZ(i, gp.getX(i) + gn.getX(i) * (r - 1), gp.getY(i) + gn.getY(i) * (r - 1), gp.getZ(i) + gn.getZ(i) * (r - 1)); }
    return geo;
  }

  // -- the clasp: a jeweller's ring, three rows round a 15 m opening, the inner row coral --
  const threadGeos = [], backGeos = [];
  {
    const rowsR = [[8.32, 0.76, 4, 0, 0], [9.98, 0.86, 2, 1, 1], [11.62, 0.8, 3, 0, 0]];
    for (const [rho, r, col, shape, lined] of rowsR) {
      const nb = Math.round(2 * Math.PI * rho / (r * 2.03)), wrong = rng.int(0, nb - 1);
      for (let k = 0; k < nb; k++) {
        const a = k / nb * Math.PI * 2 + vr.ringTurn, cs = Math.cos(a), sn = Math.sin(a);
        tmpA.copy(ringC).addScaledVector(ringUp, cs * rho).addScaledVector(ringSide, sn * rho);
        tmpB.copy(ringUp).multiplyScalar(-sn).addScaledVector(ringSide, cs);
        fixedBead(tmpA.x, tmpA.y, tmpA.z, r, tmpB.x, tmpB.y, tmpB.z, k === wrong ? (col === 4 ? 3 : 1) : col, shape, lined);
      }
    }
    const core = [];
    for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; core.push(ringC.clone().addScaledVector(ringUp, Math.cos(a) * 9.98).addScaledVector(ringSide, Math.sin(a) * 9.98)); }
    threadGeos.push(threadTubeGeometry(core, 1.15, 6, true));
    // the knot at the tie, and a tail not trimmed
    for (let k = 0; k < 6; k++) { const a = k * 1.05; fixedBead(tie.x + Math.cos(a) * 0.7, tie.y + 0.5 + (k % 2) * 0.7, tie.z + Math.sin(a) * 0.7, 0.62, Math.cos(a * 2), 0.3, Math.sin(a * 2), 5, 2, 0); }
    threadGeos.push(threadTubeGeometry([tie.clone(), tie.clone().add(new V3(1.2 * SX, -3, 0.8)), tie.clone().add(new V3(1.6 * SX, -8, 1.4)), tie.clone().add(new V3(1.2 * SX, -13, 1.2))], 0.2, 4, false, 2.2));
  }
  await ctx.yield();
  // -- the Snag: a hooked horn of beadwork on the basin rim; the thread lies in its crook --
  const snagBase = new V3(-45 * SX, 82, -127);
  {
    const L = vr.lean * 3.5, hk = vr.hook;
    const pts = [snagBase.clone(), new V3((-46 + L * 0.5) * SX, 106, -125), new V3((-43 + L) * SX, 131, -121.5), new V3((-38 + L * 0.4) * SX, 150, -118.4),
      new V3(top.x - 0.9 * SX, top.y - 2.9, top.z - 1.4), new V3(top.x + 0.5 * SX, top.y - 2.2, top.z + 0.6),
      new V3(top.x + 1.6 * SX * hk, top.y - 0.4, top.z + 2.2 * hk), new V3(top.x + 1.9 * SX * hk, top.y + 3.2 * hk, top.z + 2.6 * hk)];
    backGeos.push(horn(pts, 8.2, 0.85, 1.7, (i, k, rows, wrong) => {
      if (wrong) return [1, 0, 0];
      const band = i % 9;
      if (band === 0) return [3, 0, 0];
      if (band === 1 || band === 8) return [2, 2, 1];
      return [(i + k) % 13 === 0 ? 2 : 0, i > rows - 7 ? 2 : 0, (i + k) % 13 === 0 ? 1 : 0];
    }));
    // thread wound three times round the horn where the strand has sawn at it, with a loose tail
    const wrap = [];
    for (let k = 0; k <= 30; k++) { const a = k / 10 * Math.PI * 2, y = 150 - 1.1 * k / 10; wrap.push(new V3((-38 + L * 0.4) * SX + Math.cos(a) * 3.1, y - 2 + Math.sin(a) * 0.5, -118.4 + Math.sin(a) * 3.1)); }
    threadGeos.push(threadTubeGeometry(wrap, 0.2, 4, false));
    const w1 = wrap[30]; threadGeos.push(threadTubeGeometry([w1.clone(), w1.clone().add(new V3(0.6, -4, 0.8)), w1.clone().add(new V3(1.0, -11, 1.0))], 0.16, 4, false, 2.6));
  }
  await ctx.yield();
  // -- the far pinnacle (its top 120 m): coarse 3 m beadwork, hooked over the ring's top --
  const ringTop = ringC.clone().addScaledVector(ringUp, 12.6);
  {
    const sd = SX, P = (a, u, s) => ringC.clone().addScaledVector(ringA, a).addScaledVector(ringUp, u).addScaledVector(ringSide, s * sd);
    const pts = [P(34, -128, 30), P(30, -84, 27), P(24, -42, 21), P(15, -6, 13), P(7, 12.5, 5), P(1.2, 15.6, 0.6), P(-2.6, 14.4, -0.4), P(-3.8, 11.6, -0.6)];
    backGeos.push(horn(pts, 15, 1.3, 3.0, (i, k, rows, wrong) => {
      if (wrong) return [1, 0, 0];
      const band = i % 7;
      return band === 0 ? [2, 0, 1] : [band === 3 && k % 2 === 0 ? 1 : 0, 0, 0];
    }, 0.8));
  }
  await ctx.yield();

  // -- row-lattice meshes: the bastion (headwall + basin wall, notched), the heap, the cone and river bed, the core --
  const N2 = ctx.noise;
  function gridGeo(nu, nv, fn, wrapU = false) {
    const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx = [], o = [0, 0, 0, 0, 0];
    for (let j = 0, q = 0; j <= nv; j++) for (let i = 0; i <= nu; i++, q++) { fn(i / nu, j / nv, o); pos[q * 3] = o[0]; pos[q * 3 + 1] = o[1]; pos[q * 3 + 2] = o[2]; uv[q * 2] = o[3]; uv[q * 2 + 1] = o[4]; }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + nu + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    if (wrapU) { const n = g.getAttribute('normal'); for (let j = 0; j <= nv; j++) { const a = j * (nu + 1), b = a + nu; const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b), l = Math.hypot(x, y, z) || 1; n.setXYZ(a, x / l, y / l, z / l); n.setXYZ(b, x / l, y / l, z / l); } }
    return g;
  }
  // the bastion: a superellipse wall round the basin; th = 0 faces +Z (the fall)
  const BZ = -72, BAX = 60, BAZ = 74, WALL_TOP = 112;
  const wallR = (th) => { const c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th)); return 1 / Math.pow(Math.pow(c / BAZ, 2.6) + Math.pow(s / BAX, 2.6), 1 / 2.6); };
  const wallXZ = (th, k, out) => { const r = wallR(th) * k; out[0] = Math.sin(th) * r * SX; out[2] = BZ + Math.cos(th) * r; return out; };
  const notchK = (x) => 1 - smoothstep(LIP_W * 0.5 - 0.5, LIP_W * 0.5 + 5, Math.abs(x));                       // 1 inside the notch
  const rimY = (th, x) => { const front = smoothstep(0.55, 0.95, Math.cos(th)); const base = lerp(98 + 7 * N2.n2(th * 1.3, vr.wallSeed) + 7 * Math.pow(Math.abs(Math.sin(th * 5.5 + vr.wallSeed)), 6), WALL_TOP, front); return lerp(base, LIP_Y - 0.6, front * notchK(x)); };
  const NTH = 120, perim = new Float32Array(NTH + 1), t2 = [0, 0, 0], t3 = [0, 0, 0];
  for (let i = 1; i <= NTH; i++) { wallXZ((i - 1) / NTH * Math.PI * 2 - Math.PI, 1, t2); wallXZ(i / NTH * Math.PI * 2 - Math.PI, 1, t3); perim[i] = perim[i - 1] + Math.hypot(t3[0] - t2[0], t3[2] - t2[2]); }
  const perimAt = (u) => { const f = clamp(u, 0, 1) * NTH, i = Math.min(NTH - 1, Math.floor(f)); return lerp(perim[i], perim[i + 1], f - i); };
  const wallPoint = (u, v, o) => {
    const th = u * Math.PI * 2 - Math.PI, face = Math.min(v / 0.8, 1), over = Math.max(0, (v - 0.8) / 0.2);
    const rib = 0.1 * Math.pow(Math.abs(Math.sin(th * 5.5 + vr.wallSeed)), 4) * (1 - 0.7 * smoothstep(0.75, 0.95, Math.cos(th))) + 0.02 * N2.n2(th * 5, face * 3 + vr.wallSeed);       // buttress ribs, dimples
    const k = 1 + Math.pow(1 - face, 2.2) * 0.22 + rib * (1 - over) - over * 0.14 - 0.02 * Math.sin(face * 3.1);
    wallXZ(th, k, o);
    const ry = rimY(th, o[0]);
    o[1] = lerp(-6, ry, face) - over * over * 3.5;
    o[3] = perimAt(u); o[4] = lerp(-6, WALL_TOP, face) * (ry / WALL_TOP) + over * 12 + (ry - 100);
    return o;
  };
  await ctx.yield();
  // (the wall's points are worked out a few rows at a time, so no step of the build holds the page)
  const wallPre = new Float32Array((NTH + 1) * 27 * 5);
  { const o = [0, 0, 0, 0, 0]; for (let j = 0, q = 0; j <= 26; j++) { for (let i = 0; i <= NTH; i++, q++) { wallPoint(i / NTH, j / 26, o); wallPre.set(o, q * 5); } if (j % 3 === 2) await ctx.yield(); } }
  let wq = 0;
  const wallGeo = gridGeo(NTH, 26, (u, v, o) => { for (let k = 0; k < 5; k++) o[k] = wallPre[wq + k]; wq += 5; }, true);
  await ctx.yield();
  { const ov = new Float32Array((NTH + 1) * 27); for (let j = 0, q = 0; j <= 26; j++) for (let i = 0; i <= NTH; i++, q++) ov[q] = Math.max(0, (j / 26 - 0.8) / 0.2); wallGeo.setAttribute('aOv', new THREE.BufferAttribute(ov, 1)); }
  const wallMat = rowMaterial(style, { header: 'attribute float aOv;', vertex: 'AUX.x = aOv;', fragment: /* glsl */`
    vec2 pc = (floor(uv/37.) + 0.5)*37. + (vec2(hash2(floor(uv/37.)), hash2(floor(uv/37.) + 7.3)) - 0.5)*20.;
    vec2 pd = uv - pc; uv -= pd*exp(-dot(pd, pd)/40.)*0.42;                      // a pucker: tension pulled too tight
    PITCH = 1.2; float rw = floor(uv.y/PITCH), cl = floor(uv.x/PITCH + 0.5*mod(rw, 2.));
    float zz = abs(mod(cl*0.5 + 600., 26.) - 13.), band = mod(rw - zz + 800., 17.);
    // the fall's two flanks are calm dark planes: midnight, the zigzag in a close navy, no pale bead anywhere (the gust
    // does not turn them: the pour is the one bright thing here)
    COLA = band < 4. ? uNavy : uDeep; COLB = COLA; COLW = uNavy;
    // far off, where its rows are too fine to draw, the wall is one plain midnight mass (the dark flank of the white
    // stroke); the coping that turns in over the basin lies under real beads and is dark backing cloth
    DARK = 1.; FARC = uDeep;
    if (AUX.x > 0.03) { FLAT = 1.; FARC = uVelvet*1.6 + uBlue*0.22; }` });
  const wall = new THREE.Mesh(wallGeo, wallMat); wall.name = 'bastion'; root.add(wall);
  await ctx.yield();
  // near tier: real (impostor) beads on the same lattice and pattern over the cheeks of the notch, where the climb passes
  {
    const o = [0, 0, 0, 0, 0], P = 1.2, uOf = (pm) => { let i = 1; while (i < NTH && perim[i] < pm) i++; return (i - 1 + (pm - perim[i - 1]) / Math.max(perim[i] - perim[i - 1], 1e-6)) / NTH; };
    const cl0 = Math.floor(perim[NTH / 2] / P);
    for (let rw = 6; rw < 98; rw++) for (let dc = -36; dc <= 36; dc++) {
      if (dc === -36 && rw % 8 === 0) await ctx.yield();
      const cl = cl0 + dc, u = uOf((cl + 0.5 - 0.5 * (rw % 2)) * P);
      wallPoint(u, 0.4, o);
      const ax = Math.abs(o[0]);
      if (ax < LIP_W * 0.5 - 1.5 || ax > LIP_W * 0.5 + 25 || (rw < 40 && ax < LIP_W * 0.5 + 2.5)) continue;
      const th = u * Math.PI * 2 - Math.PI, ry = rimY(th, o[0]), face = (((rw + 0.5) * P - (ry - 100)) * WALL_TOP / ry + 6) / (WALL_TOP + 6);
      if (face > 0.985 || face < 0.05) continue;
      wallPoint(u, face * 0.8, o);
      const zz = Math.abs(((cl * 0.5 + 600) % 26) - 13), band = (((rw - zz + 800) % 17) + 17) % 17, wrong = rng() < 0.045;
      let col = 0, lined = 0; if (band < 4) col = 6; if (wrong) col = 1;
      if (ax < LIP_W * 0.5 + 5 && (cl * 7 + rw * 3) % 5 < 2) { col = 1; lined = 1; }       // a pale sheen on the wet beads beside the pour: slate with a lit core
      fixedBead(o[0] + Math.sin(th) * 0.3 * SX, o[1], o[2] + Math.cos(th) * 0.3, P * 0.49, Math.cos(th) * SX, 0, -Math.sin(th), col, 3, lined);
    }
    await ctx.yield();
    // the coping that turns in over the basin: three rows of 2.5 m beads round the rim (the crest looks down on it)
    for (let rc = 0; rc < 3; rc++) {
      const nbc = 160 - rc * 7;
      for (let i = 0; i < nbc; i++) {
        const u = (i + 0.5 * (rc % 2)) / nbc, th = u * Math.PI * 2 - Math.PI;
        wallPoint(u, 0.8 + 0.2 * (0.27 + rc * 0.3), o);
        if (notchK(o[0]) * smoothstep(0.55, 0.95, Math.cos(th)) > 0.2) continue;
        let col = (i + rc * 3) % 9 === 0 ? 3 : (rc === 1 ? (i % 13 === 5 ? 1 : 2) : 0);
        if (Math.cos(th) > 0.45) col = col === 0 ? 0 : (col === 1 ? 1 : 6);                 // the part that faces the river, beside the fall: dark
        fixedBead(o[0], o[1] + 0.35, o[2], 1.26, Math.cos(th) * SX, 0, -Math.sin(th), col, 0, col === 2 ? 1 : 0);
      }
    }
  }
  // rim beads: boulder beads along the top edge, coping the notch, so the silhouette is beads
  for (let i = 0; i < 300; i++) {
    const th = (i + 0.5) / 300 * Math.PI * 2 - Math.PI; wallXZ(th, 0.985, t2); wallXZ(th + 0.01, 0.985, t3);
    const y = rimY(th, t2[0]), nk = notchK(t2[0]) * smoothstep(0.55, 0.95, Math.cos(th));
    if (nk > 0.5) continue;                                                           // the lip itself is kept clear for the pour
    const l = Math.hypot(t3[0] - t2[0], t3[2] - t2[2]) || 1, edge = nk > 0.02;
    const fr = Math.cos(th) > 0.45, rc = i % 11 === 3 ? 1 : (i % 5 === 0 ? 3 : 2);        // (the river's side of the rim is dark, as the flanks are)
    // (round 6) the headwall's shoulders either side of the notch carry a LIT rim (pearl, silver-lined, coral by turns; shape 5:
    // such a bead turns to its dark side as we come within 25 m, so it never stands pale against the lens at the lip)
    if (fr && Math.abs(t2[0]) < 40) { const lc = i % 3 === 1 ? 4 : (i % 3 === 0 ? 3 : 2); fixedBead(t2[0], y + 0.7, t2[2], 1.2, (t3[0] - t2[0]) / l, 0, (t3[2] - t2[2]) / l, lc, 5, lc === 2 ? 1 : 0); continue; }
    fixedBead(t2[0], y + 0.5, t2[2], edge ? 0.95 : (i % 5 === 0 ? 1.15 : 0.82), (t3[0] - t2[0]) / l, 0, (t3[2] - t2[2]) / l, fr ? (rc === 1 ? 1 : (rc === 3 ? 6 : 0)) : rc, i % 5 === 0 ? 0 : 2, fr || i % 5 === 0 ? 0 : 1);
  }
  // (round 4) and down both sides of the notch a row of boulder beads, so the slot of sky over the lip is edged with
  // beads from the river and from the climb (no rng draw: their seeds are hashed, the pour's beads keep theirs)
  for (let sd = -1; sd <= 1; sd += 2) {
    let lx = 1e9, ly = 1e9, lz = 1e9, nb = 0;
    for (let i = 0; i < 300; i++) {
      const th = sd * i * 0.002; wallXZ(th, 0.99, t2);
      const nk = notchK(t2[0]) * smoothstep(0.55, 0.95, Math.cos(th));
      if (nk > 0.985 || nk < 0.03) continue;
      const y = rimY(th, t2[0]) + 0.35;
      if (Math.hypot(t2[0] - lx, y - ly, t2[2] - lz) < 2.3) continue;
      lx = t2[0]; ly = y; lz = t2[2];
      // (round 6: the rim of the slot is LIT: pearl, silver-lined and coral by turns, so the notch reads as an opening on the night sky from the river)
      { const rc = nb % 3 === 1 ? 4 : (nb % 3 === 0 ? 3 : 2); FB.p.push(lx, ly, lz, 1.2 + 0.14 * ((nb * 7) % 3 === 0 ? 1 : 0)); FB.ax.push(0.25 * sd, 0.2, 1); FB.k.push(rc, 5, (nb * 0.61803 + (sd > 0 ? 0.13 : 0.57)) % 1, rc === 2 ? 1 : 0); nb++; }
    }
  }
  // heap: the basin heaped with pearls, creeping to the lip (rows are lanes along +Z)
  const heapY = (x, z) => {
    const e = Math.hypot(x / (BAX - 4), (z - BZ) / (BAZ - 4));
    const mound = 5.5 * Math.exp(-((x + 24 * SX) ** 2 + (z + 99) ** 2) / 520) + 2.2 * N2.n2(x * 0.045 + vr.heapSeed, z * 0.045);
    const toLip = smoothstep(-34, 0, z);
    return lerp(LIP_Y + 4.5 + mound * (1 - 0.6 * e * e), LIP_Y + 0.35, toLip) - smoothstep(0.86, 1.02, e) * (1 - toLip * notchK(x)) * 1.4;
  };
  const heapGeo = gridGeo(56, 18, (u, v, o) => {
    const th = u * Math.PI * 2 - Math.PI; wallXZ(th, 0.03 + 0.93 * Math.sqrt(v), o);
    const front = smoothstep(0.8, 0.98, Math.cos(th)) * notchK(o[0]);
    if (front > 0 && v > 0.8) o[2] = lerp(o[2], Math.max(o[2], 1.2), front * (v - 0.8) * 5);
    o[1] = heapY(o[0], o[2]); o[3] = o[2]; o[4] = o[0];
  }, true);
  const flowU = { uFlow: { value: 0 } };
  const heapMat = rowMaterial(style, { uniforms: flowU, side: THREE.DoubleSide, fragHeader: 'uniform float uFlow;', fragment: /* glsl */`
    PITCH = 1.25; ROLL = 1.; SHEAR = 0.8; SCROLL = uFlow*1.1; BRICK = 0.;
    // a dark bed of slate and midnight rounds; every third lane is pearls creeping to the lip (and the loose pearls lie on it)
    COLA = uSlate; COLB = mix(uSlate, uBlue, 0.6); COLW = uSilver; LINED = 0.;
    // (round 4: the heap's beads are real rounds now, 'heap-carpet'; this sheet is only the dark cloth seen between them)
    FLAT = 1.; DARK = 1.; FARC = mix(uSlate, uBlue, 0.6)*0.5 + uVelvet;   // (seen at a grazing angle the heap is one calm dark cloth under its loose pearls)` });
  const heap = new THREE.Mesh(heapGeo, heapMat); heap.name = 'heap'; root.add(heap);
  await ctx.yield();
  // cone and river bed: one sheet, lanes running downstream (+Z)
  const CONE_Z = 28, CONE_R = 26, CONE_H = vr.coneH, BED_Z1 = 100;
  const bedY = (x, z) => {
    const r = Math.hypot(x, (z - CONE_Z) * (z < CONE_Z ? 1.25 : 0.86)) / CONE_R;
    const cone = CONE_H * Math.pow(Math.max(0, 1 - r), 1.25) * (1 - 0.25 * Math.exp(-r * r * 30));
    const river = 0.9 * Math.cos(clamp(x / 17, -1.5, 1.5)) + 3.5 * smoothstep(15, 24, Math.abs(x)) - 8 * smoothstep(27, 34, Math.abs(x)) - 0.4;
    return Math.max(cone + river * (1 - Math.min(1, cone / 6)), river);
  };
  const BNX = 44, BNZ = 64, arc = new Float32Array((BNX + 1) * (BNZ + 1));
  for (let i = 0; i <= BNX; i++) for (let j = 1; j <= BNZ; j++) {
    const x = lerp(-34, 34, i / BNX), z0 = lerp(-3, BED_Z1, (j - 1) / BNZ), z1 = lerp(-3, BED_Z1, j / BNZ);
    arc[j * (BNX + 1) + i] = arc[(j - 1) * (BNX + 1) + i] + Math.hypot(z1 - z0, bedY(x, z1) - bedY(x, z0));
  }
  const bedGeo = gridGeo(BNX, BNZ, (u, v, o) => {
    o[0] = lerp(-34, 34, u); o[2] = lerp(-3, BED_Z1, v); o[1] = bedY(o[0], o[2]);
    const i = Math.round(u * BNX), j = Math.round(v * BNZ); o[3] = arc[j * (BNX + 1) + i] - arc[20 * (BNX + 1) + i] + lerp(-3, BED_Z1, 20 / BNZ); o[4] = o[0];
  });
  const bedMat = rowMaterial(style, { uniforms: flowU, side: THREE.DoubleSide, fragHeader: 'uniform float uFlow;', fragment: /* glsl */`
    PITCH = 1.4; ROLL = 1.; SHEAR = 0.7; SCROLL = uFlow*3.; BRICK = 0.;
    float dn = smoothstep(50., 90., uv.x);                 // the cone is a heap of pearls; downstream the bed goes to slate and midnight under the rolling pearls
    COLA = mix(uPearl, uSlate, dn); COLB = mix(uSilver, mix(uSlate, uBlue, 0.6), dn); COLW = mix(uSlate, uSilver, dn); LINED = mix(0.5, 0.15, dn);
    if (mod(floor(uv.y/PITCH), 5.) < 1.) { COLA = mix(uSilver, uNavy, dn); COLB = mix(mix(uSilver, uGlint, 0.6), uBlue, dn); LINED = 1. - dn; }
    GLINT = 1. - 0.5*dn;
    // (round 4: close to and seen at a grazing angle, as from the climb, the cone is dark cloth under its loose pearls, never a pale striped sheet)
    float gzb = (1. - GRAZE)*(1. - smoothstep(38., 62., length(vVP)));
    // (round 6: and wherever it is looked down on from near by, as the steady camera does on the climb: cloth, not foreshortened ovals)
    float obl = (1. - smoothstep(0.6, 0.85, abs(ja.x*jb.y - ja.y*jb.x)/max(max(dot(ja, ja), dot(jb, jb)), 1e-9)))*(1. - smoothstep(45., 80., length(vVP)));
    gzb = max(gzb, obl); FLAT = max(FLAT, obl);
    DARK = gzb; FARC = mix(uSlate, uDeep, 0.5); COLA = mix(COLA, uSlate, gzb); COLB = mix(COLB, mix(uSlate, uDeep, 0.6), gzb); LINED *= 1. - gzb;` });
  const bed = new THREE.Mesh(bedGeo, bedMat); bed.name = 'cone-and-bed'; root.add(bed);
  // 3 m boulder beads edging both banks below the cone
  for (let sd = -1; sd <= 1; sd += 2) for (let k = 0; k < 2; k++) for (let z = 46 + k * 1.6; z < BED_Z1 + 2; z += 3.15) {
    const x = sd * (19.5 + k * 3.3 + Math.sin(z * 0.11) * 1.2), big = 1.5 - k * 0.25;
    fixedBead(x, bedY(x, z) + big * 0.7, z, big, 0.2 * sd, 0.1, 1, (Math.round(z) + k) % 9 === 0 ? 1 : (k ? 0 : (sd < 0 ? 2 : 0)), 0, k ? 0 : (sd < 0 ? 1 : 0));
  }
  await ctx.yield();

  // -- the pour. One closed form for a loose bead: lip -> ballistic arc (fall capped at 25 m/s) -> two bounces -> roll --
  const G = 9.8, VCAP = 25, TC = VCAP / G, V0 = 7;
  const fallJS = (t) => (t < TC ? 0.5 * G * t * t : 0.5 * G * TC * TC + VCAP * (t - TC));
  const LOOSE_GLSL = /* glsl */`
    uniform vec3 uCamL, uCamF; uniform float uFlow, uSurge; uniform vec4 uClrA, uClrB;
    float fallD(float t){ return t < ${TC.toFixed(4)} ? ${(0.5 * G).toFixed(2)}*t*t : ${(0.5 * G * TC * TC).toFixed(3)} + ${VCAP.toFixed(1)}*(t - ${TC.toFixed(4)}); }
    float bedYg(vec2 p){
      float dz = (p.y - ${CONE_Z.toFixed(1)})*(p.y < ${CONE_Z.toFixed(1)} ? 1.25 : 0.86);
      float r = length(vec2(p.x, dz))/${CONE_R.toFixed(1)};
      float cone = ${CONE_H.toFixed(3)}*pow(max(0., 1. - r), 1.25)*(1. - 0.25*exp(-r*r*30.));
      float river = 0.9*cos(clamp(p.x/17., -1.5, 1.5)) + 3.5*smoothstep(15., 24., abs(p.x)) - 8.*smoothstep(27., 34., abs(p.x)) - 0.4;
      return max(cone + river*(1. - min(1., cone/6.)), river);
    }
    // a tumbling frame from a seed and two angles: the hole axis turns, and the bead turns about it
    void tumble(float seed, float th, float ph, out vec3 ax, out vec3 e1){
      float a = seed*61.7, z = fract(seed*17.3)*2. - 1., s = sqrt(max(1. - z*z, 0.));
      vec3 k = vec3(s*cos(a), z, s*sin(a));
      vec3 u = cross(k, vec3(0.31, 0.2, 0.93)); u *= inversesqrt(max(dot(u, u), 1e-5)); vec3 w = cross(k, u);
      ax = u*cos(th) + w*sin(th);
      vec3 c = cross(ax, k); e1 = k*cos(ph) + c*sin(ph);
    }
    // keep a clear tube round the eye: anything nearer than 3 m is pushed out sideways
    // (and out of a cone round the line of sight for the first six metres, so no bead sits against the lens)
    // (round 7) a clear cone from the eye to something that flies with us (q: its place and its radius; radius 0 = none):
    // the loose beads part round it, so it is seen whole against the beads behind
    vec3 clearCone(vec3 c, vec4 q){
      vec3 ax = q.xyz - uCamL; float L = max(length(ax), 1e-3); ax /= L;
      vec3 d = c - uCamL; float al = dot(d, ax); vec3 lat = d - ax*al; float ll = length(lat);
      float qw = max(q.w, 1e-3);
      float need = q.w*clamp(al/L, 0., 1.)*(1. - smoothstep(L + qw, L + qw*2.5, al))*step(0., al);
      return c + lat/max(ll, 1e-3)*max(0., need - ll);
    }
    vec3 keepClear(vec3 c){
      vec3 d = c - uCamL; float l = length(d); c += d/max(l, 1e-3)*max(0., 3.2 - l);
      d = c - uCamL; float al = dot(d, uCamF);
      vec3 lat = d - uCamF*al; float ll = length(lat);
      float need = (0.9 + 0.6*max(al, 0.))*(1. - smoothstep(7.5, 12., al))*step(0., al);
      c += lat/max(ll, 1e-3)*max(0., need - ll);
      return clearCone(clearCone(c, uClrA), uClrB);
    }
    void looseLook(float seed, out vec3 ca, out vec3 cb, out float kind, out float lined){
      float h = fract(seed*91.3);
      ca = uPearl; cb = mix(uPearl, uSilver, 0.9); kind = 0.; lined = 0.4;
      if (h < 0.24) { ca = uSilver; cb = mix(uSilver, uGlint, 0.55); lined = 1.; }
      if (h < 0.07) { kind = 1.; }
      if (h > 0.975) { ca = uSlate; cb = uSlate; lined = 0.; }
    }`;
  const looseU = { uCamL: { value: new V3(0, -999, 0) }, uCamF: { value: new V3(0, 0, -1) }, uFlow: flowU.uFlow, uSurge: { value: 0 },
    uClrA: { value: new THREE.Vector4(0, -999, 0, 0) }, uClrB: { value: new THREE.Vector4(0, -999, 0, 0) } };
  const coreTL = (x, v0, r) => { let t = 3.0; for (let i = 0; i < 80; i++, t += 0.04) if (LIP_Y + 0.4 + r - fallJS(t) < bedY(x, 0.6 + v0 * t) + r) break; return t; };
  {
    // the solid core: a sheet on the mean arc, rows pouring down it
    const NU = 14, NV = 30, tl = new Float32Array(NU + 1), ar = new Float32Array((NU + 1) * (NV + 1));
    for (let i = 0; i <= NU; i++) tl[i] = coreTL(lerp(-0.5, 0.5, i / NU) * LIP_W, V0, 0) + 0.25;
    const cp3 = (i, j, o) => { const t = j / NV * tl[i], x = lerp(-0.5, 0.5, i / NU) * LIP_W; o[0] = x * (1 + 0.1 * j / NV); o[1] = LIP_Y + 0.35 - fallJS(t); o[2] = 0.4 + V0 * t - 1.4 * Math.sin(i / NU * Math.PI); return o; };
    for (let i = 0; i <= NU; i++) for (let j = 1; j <= NV; j++) { cp3(i, j - 1, t2); cp3(i, j, t3); ar[j * (NU + 1) + i] = ar[(j - 1) * (NU + 1) + i] + Math.hypot(t3[1] - t2[1], t3[2] - t2[2]); }
    const coreGeo = gridGeo(NU, NV, (u, v, o) => { const i = Math.round(u * NU), j = Math.round(v * NV); cp3(i, j, o); o[3] = ar[j * (NU + 1) + i]; o[4] = o[0]; });
    const coreMat = rowMaterial(style, { uniforms: { ...flowU, uSurge: looseU.uSurge, uCoreFar: { value: 0.8 } }, side: THREE.DoubleSide, header: 'uniform float uSurge;', vertex: `P.x *= 1. + 0.9*uSurge*smoothstep(0., 9., ${(LIP_Y + 0.35).toFixed(2)} - P.y);`, fragHeader: 'uniform float uFlow, uCoreFar;', fragment: /* glsl */`
      float dC = length(vVP); PITCH = dC > 225. ? 6. : (dC > 70. ? 3. : 1.5);     // distance makes beads bigger and fewer: from the river the fall is four lanes of 6 m pearls pouring, not a blank stroke
      ROLL = 1.; SHEAR = 0.5; SCROLL = uFlow*15.; FLAT = 0.25; COLA = uPearl; COLB = mix(uPearl, uSilver, 0.7); COLW = uSilver; LINED = 0.3; BRICK = 0.; DARK = 1.; FARC = uPearl;
      // far off the core is the shadowed inside of the fall (slate rounds on midnight): the big pearls tumbling in front of it are the white
      // close to, the core is drawn as its lanes' flat tints (pearl and silver by turns: streaks of the flow) behind the loose beads, never as flat discs
      float nearC = 1. - smoothstep(18., 40., dC);
      // (round 4: close to and square on, the core is rows of slate rounds on midnight pouring behind the loose pearls)
      // (and wherever the sheet is seen at a grazing angle, as it is all the way up the climb: never a flat pale striped surface)
      float gz = max(nearC, (1. - GRAZE)*(1. - smoothstep(110., 160., dC)));
      float fc = max(uCoreFar, gz);                             // (at every distance: the pearls tumbling before it are the white, the core is the dark behind them)
      // (round 6) close to (the steady camera looks down on it from 8 m) the core is plain dark cloth behind the loose pearls: one flat
      // slate-midnight tone, never rows printed on a smooth sheet
      FLAT = max(FLAT, nearC);
      // (and within 100 m wherever the sheet is not seen square on, as the steady camera sees it looking down the pour: cloth, not foreshortened ovals)
      float sqC = abs(ja.x*jb.y - ja.y*jb.x)/max(max(dot(ja, ja), dot(jb, jb)), 1e-9);
      FLAT = max(FLAT, (1. - smoothstep(0.6, 0.85, sqC))*(1. - smoothstep(60., 110., dC)));
      FLAT = max(FLAT, 1. - smoothstep(70., 120., dC));        // (and square on within 70 m too: its rows are drawn only from the river and the gorge, where they stand for the far pour)
      FARC = mix(FARC, mix(uSlate, uDeep, 0.5), gz);
      COLA = mix(COLA, uSlate, fc); COLB = mix(COLB, mix(uSlate, uDeep, 0.6), fc); COLW = mix(COLW, uSlate, fc); FARC = mix(FARC, mix(uSlate, uDeep, 0.45), fc); LINED *= 1. - fc; GLINT = 1. - fc;
      // (round 7) within some 55 m the core's beads are real rounds ('core-carpet'): the sheet is the dark thread-shadow between them
      FARC = mix(mix(uDeep, uVelvet, 0.45), FARC, smoothstep(40., 62., dC));` });
    const core = new THREE.Mesh(coreGeo, coreMat); core.name = 'pour-core'; root.add(core);
  }
  await ctx.yield();
  // -- core carpet (round 7): the inside of the fall as real rounds. Close to (within some 55 m: all the way up the
  // climb) the core sheet is only the dark cloth between them; on it pour lanes of small rounds, slate and midnight
  // with one in five silver-lined, each with its rim and its hole, every lane at its own speed (slower than the loose
  // pearls in front, so near and far shear). A bead walks one pitch down the mean arc and then stands for the next
  // bead of its lane, as on the heap. No draw from rng: every look is hashed from lane and slot. --
  {
    const P = detail < 0.8 ? 0.66 : 0.5, VA = Math.hypot(V0, VCAP);
    const arcJS = (t) => { const tt = Math.min(t, TC), q = G * tt / V0; return 0.5 * tt * Math.sqrt(V0 * V0 + G * G * tt * tt) + V0 * V0 / (2 * G) * Math.log(q + Math.sqrt(q * q + 1)) + Math.max(t - TC, 0) * VA; };
    const nl = Math.floor(LIP_W * 0.5 / P), K3 = [];
    for (let li = -nl; li <= nl; li++) {
      const x0 = li * P, tl = coreTL(x0, V0, 0) + 0.25, ns = Math.ceil(arcJS(tl) / P);
      for (let j = 0; j < ns; j++) K3.push(x0, j, tl);
      if ((li + nl) % 8 === 7) await ctx.yield();
    }
    const n = K3.length / 3, g = beadQuadGeometry(n);
    g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(K3), 3));
    const m = beadMaterial(style, { uniforms: looseU, header: LOOSE_GLSL + /* glsl */`attribute vec3 aK;
      float arcD(float t){
        float tt = min(t, ${TC.toFixed(4)}), q = ${(G / V0).toFixed(4)}*tt;
        return 0.5*tt*sqrt(${(V0 * V0).toFixed(2)} + ${(G * G).toFixed(3)}*tt*tt) + ${(V0 * V0 / (2 * G)).toFixed(4)}*log(q + sqrt(q*q + 1.)) + max(t - ${TC.toFixed(4)}, 0.)*${VA.toFixed(3)};
      }
      float arcStep(float t, float s){ float vy = min(${G.toFixed(2)}*t, ${VCAP.toFixed(1)}); return max(t + (s - arcD(t))*inversesqrt(${(V0 * V0).toFixed(2)} + vy*vy), 0.); }`, body: /* glsl */`
      float lane = floor(aK.x/${P.toFixed(3)} + 0.5), v = 8.5*(1. + 0.7*(hash1(lane*1.37 + 3.) - 0.5));
      float cyc = uFlow*v/${P.toFixed(3)} + hash1(lane + 9.), kc = floor(cyc), f = cyc - kc;
      float seed = hash2(vec2(lane, aK.y - kc) + 0.37);
      float s = (aK.y + f)*${P.toFixed(3)};                        // metres down the mean arc from the lip
      float t = min(s/${V0.toFixed(1)}, sqrt(s/${(0.5 * G).toFixed(2)}) + 0.2);
      t = arcStep(t, s); t = arcStep(t, s); t = arcStep(t, s); t = arcStep(t, s);
      float tl = aK.z, vy = min(${G.toFixed(2)}*t, ${VCAP.toFixed(1)});
      float y = ${(LIP_Y + 0.35).toFixed(2)} - fallD(t);
      float x = (aK.x + (fract(seed*23.7) - 0.5)*0.07)*(1. + 0.1*t/max(tl, 0.1));
      x *= 1. + 0.9*uSurge*smoothstep(0., 9., ${(LIP_Y + 0.35).toFixed(2)} - y);
      vec3 p = vec3(x, y, 0.4 + ${V0.toFixed(1)}*t - 1.4*sin((aK.x/${LIP_W.toFixed(2)} + 0.5)*3.14159));
      float r = ${(0.46 * P).toFixed(3)}*(0.8 + 0.2*fract(seed*7.3))*smoothstep(0.02, 0.3, t)*(1. - smoothstep(tl - 0.4, tl - 0.12, t));
      r *= 1. - smoothstep(48., 64., length(p - uCamL));          // far off the sheet's own rows stand for them
      vec3 nr = vec3(0., ${V0.toFixed(1)}, vy)*inversesqrt(${(V0 * V0).toFixed(2)} + vy*vy);
      C = p + nr*r*0.6; R = r; SEED = seed;
      float spin = seed*40. + s/${(0.46 * P).toFixed(3)}*0.35;
      AX = normalize(vec3(1., (fract(seed*5.3) - 0.5)*0.9, (fract(seed*9.1) - 0.5)*0.9));
      vec3 fw = vec3(0., -vy, ${V0.toFixed(1)}); fw -= AX*dot(fw, AX); fw *= inversesqrt(max(dot(fw, fw), 1e-5));
      E1 = fw*cos(spin) + cross(AX, fw)*sin(spin);
      float h = fract(seed*91.3);
      COLA = uSlate; COLB = mix(uSlate, uBlue, 0.45); LINED = 0.;
      if (h < 0.36) { COLA = uBlue; COLB = mix(uBlue, uSlate, 0.3); }
      if (h > 0.8) { COLA = uSilver; COLB = mix(uSilver, uGlint, 0.45); LINED = 1.; }` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'core-carpet'; root.add(mesh);
  }
  const PP = 14;                                             // seconds for one pour bead's whole walk
  {
    const n = Math.round(13500 * detail), aA = new Float32Array(n * 4), aB = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const lane = rng() - 0.5, big = rng() < 0.12, r = big ? rng.range(0.45, 0.62) : rng.range(0.25, 0.42);
      const front = Math.pow(rng(), 1.7), v0 = V0 - 0.6 + front * 4.6;                 // most hug the core, some fly well clear of it
      const x = lane * LIP_W, tL = coreTL(x * (1 + 0.04 * 4), v0, r) - 0.04 * rng();
      const kd = rng.range(-1, 1) * 1.25 + lane * 1.3;                               // direction after landing: outward and downstream
      aA[i * 4] = rng(); aA[i * 4 + 1] = lane; aA[i * 4 + 2] = r; aA[i * 4 + 3] = v0;
      aB[i * 4] = tL; aB[i * 4 + 1] = Math.sin(kd); aB[i * 4 + 2] = Math.cos(kd) * (rng() < 0.2 ? -0.3 : 1); aB[i * 4 + 3] = rng.range(0.6, 1.25) * (big ? 0.7 : 1);
      if (i % 400 === 399) await ctx.yield();
    }
    const g = beadQuadGeometry(n);
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
    const m = beadMaterial(style, { uniforms: looseU, header: LOOSE_GLSL + 'attribute vec4 aA, aB;', body: /* glsl */`
      float seed = aA.x, r = aA.z, v0 = aA.w, tL = aB.x, bs = aB.w;
      float t = fract(uTime/${PP.toFixed(1)} + seed)*${PP.toFixed(1)};
      const float tA = 1.5;
      float h1 = 5.2*bs, b1 = sqrt(8.*h1/9.8), h2 = h1*0.2, b2 = b1*0.45;
      float x0 = aA.y*${LIP_W.toFixed(2)};
      vec3 p; float spin, sc = smoothstep(0., 0.35, t), roll = 0.;
      if (t < tA) {                                             // the last metres of heap, gathering speed to the lip
        float k = t/tA; p = vec3(x0, ${(LIP_Y + 0.35).toFixed(2)} + r*0.8 + 0.5*(1. - k)*(1. - k), -5.2 + 5.6*k*k + (v0 - 7.)*0.3*k);
        spin = 5.6*k*k/r;
      } else {
        float tf = t - tA, tt = min(tf, tL);
        float fan = 1. + 0.9*uSurge*smoothstep(0., 0.9, tt);          // the surge doubles the width of the pour
        vec2 land = vec2(x0*(1. + 0.04*tL)*fan, 0.4 + v0*tL);
        p = vec3(x0*(1. + 0.04*tt)*fan, ${(LIP_Y + 0.35).toFixed(2)} + r - fallD(tt), 0.4 + v0*tt);
        spin = 5.6/r + tt*(1.2 + 2.6*fract(seed*7.7));
        if (tf > tL) {
          float q = tf - tL;                                    // since landing
          vec2 dir = vec2(aB.y, aB.z);
          float d1 = min(q, b1)*5.4*bs, d2 = clamp(q - b1, 0., b2)*4.2*bs, d3 = max(q - b1 - b2, 0.)*3.6;
          vec2 xz = land + dir*(d1 + d2) + mix(dir, vec2(dir.x*0.3, 1.), smoothstep(0., 3., q - b1 - b2))*d3;
          float hop = q < b1 ? 4.*h1*(q/b1)*(1. - q/b1) : (q < b1 + b2 ? 4.*h2*((q - b1)/b2)*(1. - (q - b1)/b2) : 0.);
          p = vec3(xz.x, bedYg(xz) + r*0.9 + hop, xz.y);
          spin += (d1 + d2 + d3)/r;
          sc *= 1. - smoothstep(${(PP - 1.2).toFixed(1)}, ${(PP - 0.1).toFixed(1)}, t);
          roll = smoothstep(0., 2.5, q - b1 - b2);
        }
      }
      // distance makes beads bigger and fewer: seen from down the river the pour is a few hundred great pearls
      // tumbling (each standing for the many behind it), and they come down to their own size as we come near
      float gd = max(1., length((modelMatrix*vec4(p, 1.)).xyz - cameraPosition)/26.), gk = mix(gd, 1., roll);
      float keep = 1. - smoothstep(0.75, 1.15, fract(seed*37.7)*gk*gk*0.5);
      p.y += r*(gk - 1.)*0.8*step(tA, t);
      // (within a dozen metres of the eye half of them are let go, shrinking as they come: the climb is through separate pearls, not a wall of them)
      float thin = mix(step(fract(seed*53.3), 0.5), 1., smoothstep(4., 8.5, length(p - uCamL)));
      C = keepClear(p); R = r*sc*mix(gk*keep, 1., roll)*thin; SEED = seed;
      {
        // (round 7) a great near pearl is seen whole: one whose disc the frame's edge would cut by more than a third
        // comes down to the size of the crowd as it leaves (the few of 60-120 px stay inside the picture)
        vec4 vq = viewMatrix*modelMatrix*vec4(C, 1.); float dq = max(-vq.z, 0.05);
        vec2 pj = vec2(projectionMatrix[0][0], projectionMatrix[1][1])/dq, nq = abs(vq.xy*pj), rq = max(R*pj, vec2(1e-5));
        float over = max((nq.x + rq.x*0.34 - 1.)/rq.x, (nq.y + rq.y*0.34 - 1.)/rq.y);
        R *= mix(1., min(1., 0.085/rq.y), smoothstep(-0.25, 0.3, over)*step(0., -vq.z));
      }
      tumble(seed, spin*0.37, spin, AX, E1);
      looseLook(seed, COLA, COLB, KIND, LINED);
      // far off the pour is one white stroke: its separate beads go to plain pearl before they go under a few pixels
      float farK = smoothstep(105., 190., length((modelMatrix*vec4(C, 1.)).xyz - cameraPosition));
      farK *= roll;                                             // (the great pearls of the fall keep their two tones and their hole: they are seen turning)
      COLA = mix(COLA, uPearl*1.1, farK); COLB = mix(COLB, uPearl*1.1, farK); KIND *= step(farK, 0.5); LINED *= 1. - farK;
      // (round 6) the necklace's coral seeds pour with its pearls: one bead in twenty-five of the fall is coral, the warm accent of the whole flight
      float corK = step(fract(seed*71.7), 0.04); COLA = mix(COLA, uCoral, corK); COLB = mix(COLB, uCoral, corK); KIND *= 1. - corK; LINED *= 1. - corK;
      if (gk > 1.6 && COLA.r > 0.8) COLA *= 1.07;               // moonlit pearl, just bright enough to bloom` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'pour-beads'; root.add(mesh);
  }
  await ctx.yield();

  // -- heap beads: loose pearls lying on the heap, creeping (then hurrying) to the notch --
  const PH = 38;
  {
    const n = Math.round(7200 * detail), aA = new Float32Array(n * 4), aB = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      let x = 0, z = 0;
      for (let k = 0; k < 8; k++) { x = rng.range(-1, 1) * (BAX - 6); z = BZ + rng.range(-1, 1) * (BAZ - 6); if (Math.hypot(x / (BAX - 7), (z - BZ) / (BAZ - 7)) < 1 && z < -7) break; }
      if (i % 3 === 0) { x = rng.range(-16, 16); z = rng.range(-70, -8); }           // a third lie along our low course over the heap, thick enough to hide the sheet under them
      const xt = clamp(x * 0.3 + rng.range(-0.5, 0.5) * LIP_W * 0.6, -LIP_W * 0.47, LIP_W * 0.47), zt = -5.2, r = (rng() < 0.1 ? rng.range(0.5, 0.7) : rng.range(0.26, 0.44)) * (i % 3 === 0 ? 1.4 : 1);
      aA[i * 4] = rng(); aA[i * 4 + 1] = x; aA[i * 4 + 2] = z; aA[i * 4 + 3] = r;
      aB[i * 4] = heapY(x, z); aB[i * 4 + 1] = heapY(lerp(x, xt, 1 / 3), lerp(z, zt, 1 / 3)); aB[i * 4 + 2] = heapY(lerp(x, xt, 2 / 3), lerp(z, zt, 2 / 3)); aB[i * 4 + 3] = xt;
      if (i % 200 === 199) await ctx.yield();
    }
    const g = beadQuadGeometry(n);
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4));
    const m = beadMaterial(style, { uniforms: looseU, header: LOOSE_GLSL + 'attribute vec4 aA, aB;', body: /* glsl */`
      float seed = aA.x, r = aA.w;
      float t = fract(uTime/${PH.toFixed(1)} + seed), w = t*t*(0.35 + 0.65*t);
      vec2 a = aA.yz, b = vec2(aB.w, -5.2), xz = mix(a, b, w);
      float yE = ${(LIP_Y + 0.9).toFixed(2)}, w3 = w*3.;
      float y = w3 < 1. ? mix(aB.x, aB.y, w3) : (w3 < 2. ? mix(aB.y, aB.z, w3 - 1.) : mix(aB.z, yE, w3 - 2.));
      vec2 d = b - a; float dl = length(d); d /= max(dl, 1e-3);
      C = keepClear(vec3(xz.x, y + r*0.75, xz.y)); R = r*smoothstep(0., 0.05, t)*(1. - smoothstep(0.965, 1., t)); SEED = seed;
      float spin = w*dl/r + seed*40.;
      AX = normalize(vec3(d.y, (fract(seed*5.3) - 0.5)*0.9, -d.x) + 1e-3);
      vec3 fw = vec3(d.x, 0., d.y); fw -= AX*dot(fw, AX); fw *= inversesqrt(max(dot(fw, fw), 1e-5));
      E1 = fw*cos(spin) + cross(AX, fw)*sin(spin);
      looseLook(seed, COLA, COLB, KIND, LINED);` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'heap-beads'; root.add(mesh);
  }
  await ctx.yield();
  // -- heap carpet (round 4): the heap itself, as real rounds. Lanes of touching beads run to the lip (+Z), slate and
  // midnight with every third lane pearl, each lane creeping at its own speed (they shear past one another and never
  // overlap). A bead walks one pitch and then stands for the next bead of its lane (its seed, size and turn travel
  // with it), so the whole heap creeps for ever out of two baked heights a bead. --
  {
    const P = detail < 0.8 ? 1.6 : 1.3, zA = BZ - BAZ, A4 = [], B4 = [];        // (coarser beads on phones)
    const sizeAt = (x, z) => { const e = Math.hypot(x / (BAX - 4), (z - BZ) / (BAZ - 4)); return (1 - smoothstep(0.93, 0.995, e)) * (1 - smoothstep(-5.5, -2.2, z)); };
    let it = 0;
    for (let li = -Math.ceil(BAX / P); li <= Math.ceil(BAX / P); li++) for (let j = 0; zA + j * P < 0; j++) {
      const x = li * P, z = zA + j * P, s0 = sizeAt(x, z), s1 = sizeAt(x, z + P);
      if (++it % 250 === 0) await ctx.yield();
      if (s0 <= 0 && s1 <= 0) continue;
      A4.push(x, z, heapY(x, z), heapY(x, z + P)); B4.push(li, j, s0, s1);
    }
    const n = A4.length / 4, g = beadQuadGeometry(n);
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A4), 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B4), 4));
    const m = beadMaterial(style, { uniforms: looseU, header: LOOSE_GLSL + 'attribute vec4 aA, aB;', body: /* glsl */`
      float lane = aB.x, v = 1.1*(1. + 0.8*(hash1(lane*1.37 + 3.) - 0.5));
      float cyc = uFlow*v/${P.toFixed(2)} + hash1(lane + 9.), kc = floor(cyc), f = cyc - kc;
      float seed = hash2(vec2(lane, aB.y - kc) + 0.37);
      float r = ${(0.5 * P).toFixed(3)}*(0.84 + 0.16*fract(seed*7.3))*mix(aB.z, aB.w, f);
      vec3 p = vec3(aA.x, mix(aA.z, aA.w, f) + r*0.5 + 0.42*fract(seed*3.1), aA.y + ${P.toFixed(2)}*f);
      C = keepClear(p); R = r; SEED = seed;
      float spin = seed*40. + uFlow*v/${(0.5 * P).toFixed(3)};
      AX = normalize(vec3(1., (fract(seed*5.3) - 0.5)*0.8, (fract(seed*9.1) - 0.5)*0.8));
      vec3 fw = vec3(0., 0., 1.); fw -= AX*dot(fw, AX); fw *= inversesqrt(max(dot(fw, fw), 1e-5));
      E1 = fw*cos(spin) + cross(AX, fw)*sin(spin);
      float h = fract(seed*91.3);
      if (hash1(lane*3.17 + 1.3) < 0.36) {                        // a lane of pearls (about one lane in three, a slate bead here and there in it)
        COLA = uPearl; COLB = mix(uPearl, uSilver, 0.8); LINED = 0.3;
        if (h < 0.13) { COLA = uSlate; COLB = uSlate; LINED = 0.; }
      } else {                                                    // slate and midnight rounds
        COLA = uSlate; COLB = mix(uSlate, uBlue, 0.6); LINED = 0.;
        if (h < 0.42) { COLA = uBlue; COLB = mix(uBlue, uSlate, 0.3); }
        if (h > 0.93) { COLA = h > 0.965 ? uPearl : uSilver; COLB = mix(uSilver, uGlint, 0.5); LINED = h > 0.965 ? 0.3 : 1.; }
      }` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'heap-carpet'; root.add(mesh);
  }
  await ctx.yield();
  // -- river beads: lanes on a sheared lattice (they never overlap), the big rounds lagging as bed-load --
  {
    const Z0 = 36, L = BED_Z1 - Z0, lanes = 23, per = Math.floor(L / 1.5), nBig = 110, n = lanes * per + nBig, aA = new Float32Array(n * 4);
    let q = 0;
    for (let j = 0; j < lanes; j++) for (let k = 0; k < per; k++, q++) { aA[q * 4] = rng(); aA[q * 4 + 1] = (j - (lanes - 1) / 2) * 1.32; aA[q * 4 + 2] = (k + rng.range(-0.12, 0.12)) * 1.5; aA[q * 4 + 3] = rng.range(0.4, 0.56); }
    for (let k = 0; k < nBig; k++, q++) { aA[q * 4] = rng(); aA[q * 4 + 1] = rng.range(-13, 13); aA[q * 4 + 2] = rng() * L; aA[q * 4 + 3] = -rng.range(0.62, 0.9); }
    const g = beadQuadGeometry(n); g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4));
    const m = beadMaterial(style, { uniforms: looseU, header: LOOSE_GLSL + 'attribute vec4 aA;', body: /* glsl */`
      float seed = aA.x, r = abs(aA.w), big = step(aA.w, 0.);
      float sp = mix(3.*(1. + 0.5*(hash1(aA.y*3.1) - 0.5)), 1.3, big);
      float d = aA.z + uFlow*sp, zz = mod(d, ${L.toFixed(1)});
      vec2 xz = vec2(aA.y, ${Z0.toFixed(1)} + zz);
      C = keepClear(vec3(xz.x, bedYg(xz) + r*(1. - 0.25*big), xz.y)); SEED = seed;
      R = r*smoothstep(0., 7., zz)*(1. - smoothstep(${(L - 7).toFixed(1)}, ${L.toFixed(1)}, zz));
      float spin = d/r;
      AX = normalize(vec3(1., (fract(seed*5.3) - 0.5)*0.8, (fract(seed*9.1) - 0.5)*0.8));
      vec3 fw = vec3(0., 0., 1.); fw -= AX*dot(fw, AX); fw *= inversesqrt(max(dot(fw, fw), 1e-5));
      E1 = fw*cos(spin) + cross(AX, fw)*sin(spin);
      looseLook(seed, COLA, COLB, KIND, LINED);` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'river-beads'; root.add(mesh);
  }
  // -- the foot of the fall: a cloud of fine pearls thrown up where the pour strikes the cone (bigger and fewer far off) --
  {
    const n = Math.round(700 * detail), aA = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { aA[i * 4] = (i + 0.5) / n; aA[i * 4 + 1] = Math.sin(i * 12.9898) * 43758.5453 % 1; aA[i * 4 + 2] = Math.sin(i * 78.233 + 1.3) * 12543.117 % 1; aA[i * 4 + 3] = Math.abs(Math.sin(i * 39.425 + 0.7) * 9631.77 % 1); }
    const g = beadQuadGeometry(n); g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4));
    const m = beadMaterial(style, { uniforms: looseU, header: LOOSE_GLSL + 'attribute vec4 aA;', body: /* glsl */`
      float seed = aA.x, T = 2.4 + 1.6*aA.w, t = fract(uTime/T + seed*7.)*T;
      vec2 p0 = vec2(aA.y*${(LIP_W * 0.62).toFixed(2)}, ${(CONE_Z - 1).toFixed(1)} + aA.z*5.);
      float vy = 8. + 9.*aA.w, tl = 2.*vy/9.8, ta = min(t, tl);
      vec3 p = vec3(p0.x + aA.y*4.5*ta, bedYg(p0) + 0.6 + vy*ta - 4.9*ta*ta, p0.y + (1.5 + 4.*fract(seed*91.))*ta);
      float gd = max(1., length((modelMatrix*vec4(p, 1.)).xyz - cameraPosition)/30.);
      float keep = 1. - smoothstep(0.7, 1.1, fract(seed*37.7)*gd*0.42);
      C = keepClear(p); SEED = seed;
      R = (0.14 + 0.16*fract(seed*23.))*gd*keep*smoothstep(0., 0.2, t)*(1. - smoothstep(tl - 0.5, tl, t));
      float spin = seed*40. + t*(3. + 4.*aA.w); tumble(seed, spin*0.4, spin, AX, E1);
      COLA = uPearl*(gd > 1.6 ? 1.07 : 1.); COLB = mix(uPearl, uSilver, 0.7); LINED = 0.4;
      if (fract(seed*11.) < 0.25) { COLA = uSilver; COLB = mix(uSilver, uGlint, 0.55); LINED = 1.; }` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'foot-spray'; root.add(mesh);
  }
  // -- the burst: 1,500 pearls keyed to the impact. Four in ten are the fan: big pearls (and the ball's wrong beads:
  // slate, silver-lined, crystal) thrown high over the heap's skyline, falling back and sinking into the heap. The rest
  // splash low and then run as one surge of tumbling pearls from the impact, under the eye, to the lip --
  const burstU = { ...looseU, uRun: SU.uRun, uRunH: SU.uRunH, uBurst: { value: new THREE.Vector4(0, -999, 0, -1) }, uBurstKind: { value: 0 } };
  {
    const n = 1500, aA = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const up = Math.pow(rng(), 0.7);
      aA[i * 4] = rng(); aA[i * 4 + 1] = rng() * Math.PI * 2; aA[i * 4 + 2] = rng.range(2, 13) * (1.15 - up * 0.6); aA[i * 4 + 3] = 3 + up * 13;
    }
    const g = beadQuadGeometry(n); g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 4));
    const m = beadMaterial(style, { uniforms: burstU, header: LOOSE_GLSL + 'attribute vec4 aA; uniform vec4 uBurst, uRun; uniform float uBurstKind, uRunH;', body: /* glsl */`
      float seed = aA.x, tb = uBurst.w, fan = step(fract(seed*11.3), 0.24);
      float r = mix(0.34 + 0.3*fract(seed*23.1), 0.5 + 0.55*fract(seed*23.1), fan);
      if (uRun.x > 0.5 && uRun.y > 0.) {                          // the run: twelve bursts, one as each ball of the train lands
        float need = floor(seed*12.)*${BALL_PITCH.toFixed(2)} + 7.4, ti = sqrt(need/6.5), v = min(13.*ti, 20.);
        tb = uRun.y - ti - (-v + sqrt(v*v + 19.6*max(uRunH, 1.)))/9.8;
      }
      float vy = mix(aA.w*0.7, 15. + 9.*fract(seed*5.7), fan), hz = mix(aA.z, 1.5 + 6.*fract(seed*3.9), fan);
      float tl = 2.*vy/9.8, ta = min(tb, tl);
      vec2 dir = vec2(cos(aA.y), sin(aA.y));
      vec3 p = uBurst.xyz + vec3(dir.x*hz*ta, vy*ta - 4.9*ta*ta + r, dir.y*hz*ta);
      // the surge: from where it landed, under the eye, to the lip, all of it there 5.4 s after the impact
      float k = clamp((tb - tl)/max(5.4 - tl, 1.), 0., 1.)*(1. - fan); float k1 = 1. - (1. - k)*(1. - k), ke = k1*k1*(3. - 2.*k1);      // (round 7: it leaves the mound fast and slows to the lip)
      vec2 cfw = uCamF.xz*inversesqrt(max(dot(uCamF.xz, uCamF.xz), 1e-4));
      // (round 6: the gaze stays up on the necklace, so the surge is aimed further ahead of the eye, where the frame's lower edge meets the heap)
      vec2 a = p.xz, b = uCamL.xz + cfw*(30. + 16.*fract(seed*29.3)) + dir*8.*fract(seed*17.), c = vec2(clamp(p.x*0.2, -10., 10.), -5.);
      vec2 sq = mix(mix(a, b, ke), mix(b, c, ke), ke);
      float gy = mix(${(LIP_Y + 5.0).toFixed(2)}, ${(LIP_Y + 0.9).toFixed(2)}, smoothstep(-34., 0., sq.y)) + r;
      // (round 7) the surge leaves the mound in great bounds (the ball fell 35 m): a band of tumbling pearls in the air under the
      // necklace, seen from the lingering place, settling to a roll as it comes under the eye to the lip
      float hopA = (3.5 + 7.5*fract(seed*13.7))*smoothstep(0., 0.07, k)*(1. - smoothstep(0.3, 0.72, k));
      hopA *= smoothstep(16., 32., length(sq - uCamL.xz));        // (never up at the eye: within 16 m of us the surge is on the heap, rolling under)
      gy += 0.5*abs(sin(tb*5. + seed*40.))*(1. - min(hopA, 1.)) + hopA*abs(sin(tb*1.7 + seed*40.));
      p = mix(p, vec3(sq.x, gy, sq.y), smoothstep(0., 0.12, k));
      C = keepClear(p); SEED = seed;
      float sz = mix(1. - smoothstep(0.85, 1., k), 1. - smoothstep(tl, tl + 1.1, tb), fan);
      R = tb < 0. ? 0. : r*smoothstep(0., 0.1, tb)*sz*mix(1., 0.75, ke)*(1. + 0.5*(1. - fan)*smoothstep(0., 0.2, k));     // (the surge's pearls are seen from further off now: half as big again)
      float spin = seed*30. + ta*(2. + 3.*fract(seed*3.3)) + ke*60./max(r, 0.1);
      tumble(seed, spin*0.4, spin, AX, E1);
      float h = fract(seed*91.3);
      COLA = mix(uPearl, uSilver, uBurstKind); COLB = mix(mix(uPearl, uSilver, 0.9), mix(uSilver, uGlint, 0.5), uBurstKind);
      KIND = uBurstKind*step(0.5, fract(seed*7.)); LINED = mix(0.4, 1., uBurstKind);
      if (h < 0.16) { COLA = uSlate; COLB = mix(uSlate, uBlue, 0.5); LINED = 0.; KIND = 0.; }
      else if (h < 0.36) { COLA = uSilver; COLB = mix(uSilver, uGlint, 0.55); LINED = 1.; KIND = step(h, 0.22); }
      else if (h < 0.43) { COLA = uCoral; COLB = uCoral; LINED = 0.; KIND = 0.; }      // (round 6: the seeds of the ball's coral caps)
      else if (fan > 0.5) COLA *= 1.07;` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'burst-beads'; root.add(mesh);
  }
  await ctx.yield();

  // -- gather: fixed impostor beads, the backing under them, the loose thread --
  {
    const n = FB.p.length / 4, g = beadQuadGeometry(n);
    g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(FB.p), 4)); g.setAttribute('aAx', new THREE.InstancedBufferAttribute(new Float32Array(FB.ax), 3));
    g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(FB.k), 4));
    const m = beadMaterial(style, { header: 'attribute vec4 aP, aK; attribute vec3 aAx;', body: /* glsl */`
      C = aP.xyz; R = aP.w; SEED = aK.z; LINED = aK.w;
      AX = aAx*inversesqrt(max(dot(aAx, aAx), 1e-6));
      vec3 e = cross(AX, vec3(0.2, 0.9, 0.4)); E1 = e*inversesqrt(max(dot(e, e), 1e-5));
      float ci = aK.x;
      COLA = ci < 0.5 ? uDeep : (ci < 1.5 ? uSlate : (ci < 2.5 ? uSilver : (ci < 3.5 ? uPearl : (ci < 4.5 ? uCoral : (ci < 5.5 ? uThread : uNavy)))));
      COLB = COLA; KIND = aK.y > 0.5 && aK.y < 1.5 ? 1. : 0.; LEN = aK.y > 1.5 && aK.y < 2.5 ? 0.4 : 0.;
      if (aK.y > 4.5) {                                           // a bead of the notch's lit rim: it turns its dark side to us as we come near
        float nr = 1. - smoothstep(24., 60., length((modelMatrix*vec4(C, 1.)).xyz - cameraPosition));
        COLA = mix(COLA, mod(floor(aK.z*40.), 2.) < 0.5 ? uNavy : uDeep, nr); COLB = COLA; LINED *= 1. - nr;
      } else if (aK.y > 2.5) {                                    // a bead of the headwall: far off it goes to the wall's plain midnight
        float far = smoothstep(120., 200., length((modelMatrix*vec4(C, 1.)).xyz - cameraPosition));
        if (ci < 0.5) COLA = uDeep;
        COLA = mix(COLA, uDeep, far); COLB = COLA; LINED *= 1. - far;
      }` });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.name = 'fixed-beads'; root.add(mesh);
    const backs = mergeGeometries(backGeos.map((b) => { b.deleteAttribute('uv'); return b; }), false);
    backGeos.forEach((b) => b.dispose());
    const bm = new THREE.Mesh(backs, backingMaterial(style, 'uVelvet*1.6 + uBlue*0.22')); bm.name = 'horn-backing'; root.add(bm);
    const threads = mergeGeometries(threadGeos, false); threadGeos.forEach((b) => b.dispose());
    const tm = new THREE.Mesh(threads, threadMaterial(style, TAIL_THREAD)); tm.frustumCulled = false; tm.name = 'loose-thread'; root.add(tm);
  }
  await ctx.yield();

  // -- the clock of the drop: every DROP_T seconds the lowest ball slides off, falls, bursts; the strand slips a place --
  const T_SLIDE = 1.5, SLIDE_D = 7.4, V_REL = 2 * SLIDE_D / T_SLIDE;
  const rel = new V3(), imp = new V3(), camL = new V3();
  let cycleOverride = null;
  function dropState(time, tc, k, out) {           // release point, fall height and impact time of cycle k
    const tRel = time - (tc - (k * DROP_T + T_SLIDE));
    strandPoint(S0 - SLIDE_D, out.rel, Math.max(tRel, 0));
    out.H = Math.max(6, out.rel.y - (heapY(out.rel.x, out.rel.z) + BALL_R * 0.8));
    out.tImp = (-V_REL + Math.sqrt(V_REL * V_REL + 2 * G * out.H)) / G;
    return out;
  }
  const ds = { rel, H: 0, tImp: 0 }, ds2 = { rel: imp, H: 0, tImp: 0 }, t3c = new V3();
  function update(dt, time, camera) {
    if (!opts.style) style.update(time, ctx.renderer);
    flowU.uFlow.value = time;
    if (camera) {
      camL.setFromMatrixPosition(camera.matrixWorld); imp.set(0, 0, -1).applyMatrix4(camera.matrixWorld);
      root.worldToLocal(camL); root.worldToLocal(imp); looseU.uCamL.value.copy(camL); looseU.uCamF.value.copy(imp).sub(camL).normalize();
    }
    const tc = Math.max(0, cycleOverride ?? time), n = Math.floor(tc / DROP_T), c = tc - n * DROP_T, nEff = n % CYCLES;
    dropState(time, tc, n, ds);
    const tf = c - T_SLIDE, gone = tf > ds.tImp;
    SU.uRelease.value.copy(ds.rel);
    SU.uDrop.value.set(c < T_SLIDE ? SLIDE_D * (c / T_SLIDE) ** 2 : SLIDE_D, tf > 0 ? V_REL * tf + 0.5 * G * tf * tf : 0, gone ? 0 : 1, Math.max(tf, 0) * 0.55);
    const e0 = clamp((c - 0.6) / 4.4, 0, 1), e = e0 * e0 * e0 * (e0 * (e0 * 6 - 15) + 10), lim = LIM0 - nEff;
    const feed = nEff === CYCLES - 1 ? (1 - e) * (SLEN - 4 - S0 - (lim + 1) * BALL_PITCH + BALL_PITCH) : 1e4;
    SU.uSlip.value.set(e, lim, feed, n + vr.phase0);
    // the burst belongs to this cycle once its ball has landed, otherwise to the one before
    let kb = n, tb = tf - ds.tImp;
    if (tb < 0) { kb = n - 1; if (kb >= 0) { dropState(time, tc, kb, ds2); tb = c + DROP_T - T_SLIDE - ds2.tImp; } else tb = -1; } else { ds2.rel.copy(ds.rel); ds2.H = ds.H; }
    burstU.uBurst.value.set(ds2.rel.x, ds2.rel.y - ds2.H - BALL_R * 0.5, ds2.rel.z, tb);
    burstU.uBurstKind.value = (kb + vr.phase0) % 5 === 0 ? 1 : 0;
    if (SU.uRun.value.x > 0.5) {
      SU.uRunH.value = ds.H;
      if (SU.uRun.value.y > 0) { strandPoint(1.5, imp, time); burstU.uBurst.value.set(imp.x, imp.y - ds.H - BALL_R * 0.5, imp.z, 1); burstU.uBurstKind.value = 1; }
      else { burstU.uBurstKind.value = 1; if (c < 1e-3) burstU.uBurst.value.w = -1; }   // held at the start of a cycle, waiting for the jerk
    }
  }
  update(0, 0, null);

  // -- anchors (local space) --
  const left = new V3(hd.z, 0, -hd.x).multiplyScalar(SX);                 // the side the camera passes on: the strand's left (its right if mirrored)
  const beside = [];
  for (let s = sTop + 26; s < SLEN - 62; s += 24) { const p = strandPoint(s); beside.push(p.addScaledVector(left, 12).add(new V3(0, 5.5, 0))); }
  const aim = ringC.clone().addScaledVector(ringA, -70);
  const flyThrough = [new V3(0, 7, 96), new V3(0, 8, 62), new V3(0, 13, 51.5), new V3(0, 100.5, 8.2), new V3(0, 103, -10), new V3(-6 * SX, 108, -42),
    new V3(-13 * SX, 121, -84), ...beside, aim, ringC.clone()];
  const anchors = {
    lip: new V3(0, LIP_Y, 0), lipWidth: LIP_W, coneTop: new V3(0, CONE_H, CONE_Z), riverEnd: new V3(0, 0, BED_Z1),
    climbFoot: new V3(0, 13, 51.5), climbTop: new V3(0, 100.5, 8.2),            // the 63 degree line up the face, 7-20 m off the core
    crest: new V3(0, 101, -4),                                                  // over the lip: look along -Z and up for the strand
    snagTip: snagTip.clone(), snagBase: snagBase.clone(), tailTip: strandPoint(0), dropFrom: strandPoint(S0), impact: strandPoint(S0 - SLIDE_D).setY(heapY(sp[0].x, sp[0].z)),
    strandLow: strandPoint(sTop + 46), strandTie: tie.clone(), strandLine: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((k) => strandPoint(sTop + (SLEN - sTop) * k)),
    strandLeft: left, basinCentre: new V3(0, LIP_Y + 5, BZ), basinRadii: new THREE.Vector2(BAX, BAZ), pinnacleFoot: ringC.clone().addScaledVector(ringA, 34).addScaledVector(ringUp, -128).addScaledVector(ringSide, 30 * SX),
    portalSeat: { position: ringC.clone(), axis: ringA.clone(), facing: ringA.clone().negate(), up: ringUp.clone(), radius: 7, opening: 7.55, tilt: 30 },
    portalApproach: aim, flyThrough,
    viewpoints: { entry: new V3(0, 6, 300), faceOn: new V3(0, 40, 120), crest: new V3(0, 101, -4), besideStrand: beside[Math.min(2, beside.length - 1)] },
  };
  const radius = 190, height = 250, center = new V3(0, 125, -110);
  return {
    object: root, radius, height, center, anchors, style, lipY: LIP_Y, strandLength: SLEN, strandPoint,
    update, setCycle(t) { cycleOverride = t; }, cycleSpan: CYCLES * DROP_T,      // seconds from a whole strand to the next whole strand
    // the rare run (opts.run): t = seconds since the thread jerked (< 0: not yet), kick = the jerk (m), lift = how far the lightened span has risen (m)
    setRun(t, kick = 0, lift = 0) { SU.uRun.value.y = t; SU.uRun.value.z = kick; SU.uRun.value.w = lift; }, setSurge(x) { looseU.uSurge.value = clamp(x, 0, 1); },
    // (round 7) two clear cones in the loose beads, from the eye to world points a and b, radius r metres there (0 = none)
    setClear(a, b, r) { t3c.copy(a); root.worldToLocal(t3c); looseU.uClrA.value.set(t3c.x, t3c.y, t3c.z, r); t3c.copy(b); root.worldToLocal(t3c); looseU.uClrB.value.set(t3c.x, t3c.y, t3c.z, r); }, setGust(x) { style.uniforms.uGust.value = clamp(x, 0, 1); },
    dispose() { curveTex.dispose(); },
    ground: false, groundY: 0,
  };
}
