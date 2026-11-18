// WHERE THE SEA TURNS SQUARE: the style kit (makeStyle) and the hero, THE TREE (buildHero).
//
// THE LAW (neo-plastic painting in three dimensions): five paints, black / red / yellow / blue and white in
// three unequal mixes, plus pale grey for the undecided shore and for bars too far away to be black. A line is
// a black bar of one of two widths (0.6 m, 2.4 m) along X, Y or Z. A plane is an unlit rectangle with its own
// depth layer. No light, shadow, fog, texture or full-screen pass. Curves exist only in grey and are corrected.
//
// makeStyle(ctx, { palette, exposure = 1 }) -> style, ONE instance shared by the whole world:
//   style.pal      { black, red, yellow, blue, whiteWarm (sea), whiteCool (sky), whiteBright, grey, grey1, grey2 }
//                  linear THREE.Colors already corrected for ACES at the given post exposure (the primaries and
//                  black land on the brief's hexes; whites are the brief's 0.80 / 0.86 / 0.92 mixes).
//   style.whites   [whiteWarm, whiteCool, whiteBright];  style.W = { thin: 0.6, thick: 2.4 };  style.CELL = 6
//   style.U        shared uniforms { uTime, uBeat, uFront, uTrunk }; style.update(dt, time, camera) drives them.
//   style.flat(color, opts)   unlit flat ShaderMaterial (merged strips, avenues, ribbons, the dune curves).
//   style.boxes(items, opts)  ONE draw call of axis-aligned boxes: every bar, plane, slab and square.
//        item = { p:[x,y,z] centre, s:[sx,sy,sz] size, c: Color, edge?: Color (paint of the thin sides: "edges
//        painted round the side"), far?: true (black bar that steps to grey at 320 / 500 / 700 m, never a fade),
//        slide?: [dx,dy,dz] (drawer offset when out), phase?: 0..1 (time drawer: rests in, slides out and back
//        with overshoot), key?: number (drawn out of one edge when uFront passes key: the Tree's panes; slide is
//        then the full length along the long axis; drawer: true keeps it sliding 40 percent out and back after),
//        hop?: [dx,dy,dz] (cell step vector: the box shuttles one cell per beat, waits 1-3 beats, eased 0.18 s) }
//   style.bar(a, b, w, c)     item for a bar from a to b (axis-aligned points) of width w, for style.boxes.
//   style.sky()               the white sky: a cool-white shell that follows the camera (call its .follow(camera)).
//   style.glsl                { ease } GLSL helpers shared by the kit's shaders.
//   style.U.uFarK (1; under 1 the grey steps come sooner: fog) and style.U.uCut (distance beyond which boxes are
//   simply left out, unless the item says keep: true); far bars are widened to stay about 1.5 px.
//   item.wedge: true gives a box the second cut distance style.U.uCutW instead (never exempt): the world uses it
//   for everything that stands behind the Tree as seen from the sea, which arrives ring by ring as the lift starts.
//   item.bold: true keeps a bar about 3.5 px wide on the canvas however far it stands (the standing grid, the first
//   lines); item.left: true marks the city left of the Tree, drawn shut into one edge while style.U.uShut is 1.
//   A hop item whose phase has a whole part n wraps after 2n cells (default 24); vertical hops step every beat or two.
//   item.near: true gives a plane THE DRAWER'S RULE, in space: it begins to draw shut into one edge when the lens
//   comes within 2.6 times its own larger side, has clicked shut at 1.8 times and opens again behind us by the same
//   rule (item.nearPos: the edge it shuts into is its positive end). item.metre: metres of the route; the box is drawn out of one
//   side (item.slide), over 16 m of flight, once the metres flown (style.U.uFlown, which the world sets) pass that mark (item.drawer: and then works like a drawer);
//   item.late: true scales a box by style.U.uLate (the crowd of an avenue that is ruled late). Box bars step to grey
//   at 320 / 500 / 700 m on every sea state (uFarK greys the sea's marks and the Tree only).
//   buildHero also takes: tilt (how much sooner the change reaches what is ahead, per metre of -Z; 0.3 by default,
//   the world passes 0.06 so that from a level gaze the change is a horizontal line at eye height: curved above,
//   clicking beside, lattice below) and paneLag (metres of front before a pane is drawn: 27 by default).
//   Near the camera line the Tree is drawn in line, not in mass: curved strokes thin to at most 4 percent of their
//   distance from it. THE SQUARED TREE IS A BOLD LATTICE OF FEW BARS: a staircase run is one of two weights on the
//   canvas (thin about 3.5 px, thick about 8.5 px in an 800 px frame, set in the limb shader from the camera distance;
//   thick is for main boughs 40 m and more from the camera line); twigs are corrected away (painted out as the front
//   passes) instead of squared; runs along the course nearer than 85 m, runs within 20-28 m of the camera line and the
//   runs below local y 84 ahead of the lift are left out; panes stand only beside runs that are drawn (one run in two
//   carries one); of the squared dabs one in fourteen stays, as a 1.8 m square. buildHero also takes sight:
//   [{ rect: [x0, y0, x1, y1, z], eyes: [[x, y, z], ...] }] (local): nothing of the squared Tree is drawn between an
//   eye and that rectangle, and the curves and dabs there are painted out by front 96, before the world draws its plane.
//   style.U.uPart (0..1, the world sets it as the lift starts): what stands between the lift line and the trunk draws
//   aside. Once it is 1, curved strokes are capped at about 0.9 percent of their distance from the camera, two
//   finer limbs in three are left out near the cage, dabs shrink within 38 m and none is drawn within 12 m.
//   Trunk, boughs and twigs are all the one pale grey (oneGrey: false restores the mid step grey on the boughs).
//   buildHero also takes: season ('blossom' | 'bare' | 'fruit'), evening (the curved Tree is red), herons (birds
//   become tall bars instead of plus signs), petal / petalSquare (paint of the dabs before and after the change),
//   flown (the course as flown in the Tree's frame, a list of [x, y, z]: no gull's orbit comes near it).
//
// buildHero(ctx, { style, palette, detail = 1, corridor, clear = 7.5, oneGrey = true, tilt, paneLag, backdrop }) -> the Tree.
//   (detail thins the petals only; oneGrey paints trunk and boughs the same pale grey as the twigs instead of the
//   mid step grey; backdrop, a white sky and a grey shore band, defaults on only when no style is passed in.)
//   Local space: trunk base at the origin (stand it on the dune top), +Y up, FRONT +Z = toward the sea (the
//   camera comes from +Z and flies -Z). About 186 m tall, crown 200-250 m wide starting 36-40 m up (bough tips reach
//   about 130 m from the trunk; the reported radius, 90, is the framing radius for the viewer).
//   Two stored shapes per segment: a grey curve (leaning trunk, boughs like blown hair, oval petals) and its
//   staircase on the 6 m lattice (black bars of the two widths, white squares, panes in the gaps).
//   PROGRESS (never wall-clock): hero.setTrunk(k 0..1) clicks the trunk upright and black (brief: 9 s);
//   hero.setFront(h) puts the change at local height h (it runs h = y + 0.3 * z, so the half of the crown AHEAD
//   of the camera (-Z) is done first; hero.setFrontAt(cageLocalPosition) does that sum, so the boughs level with the
//   cage are the ones in the act); start it at the fork (40) and after levelling off run it on
//   to 300 to finish the top and its last panes. hero.setProgress(u 0..1) does both (0-0.1 trunk, 0.2-1 front 30 -> 300).
//   If the world never calls any of them the piece plays the whole change on a 30 s loop (the stand-alone viewer).
//   Panes follow 27 m of front (1.5 s at 18 m/s) behind the bars; petals square with their bough.
//   anchors (local): corridor = the camera line the crown is carved round (default: in from the sea at x 27,
//   y 5, up a 65 degree lift, level at y 106 on -Z; nothing of the Tree, curved or straight, within `clear` m);
//   flyThrough = same list; fork, crownTop, trunkTop; avenueStart = where the yellow avenue should begin (level,
//   6 m under the corridor's last leg); viewpoints.sea / .lift / .levelOff; lattice { cell, origin }.
//   6 m under the corridor's last leg); wind; frontTilt (0.3). hero.stats counts segments, petals and panes.
//   Thirty gulls wheel round the crown (two grey strokes each) and become stepping black plus signs behind the front.
//   Cost: 70-95k triangles by seed in 4 draw calls (limbs, petals, panes, gulls; +3 for the stand-alone backdrop),
//   build 100-200 ms with no step over 20 ms, no lights, no textures, everything opaque.
import * as THREE from 'three';

const PALETTE = ['#F3F1E9', '#E8ECEE', '#141414', '#D62A1E', '#F2C91A', '#1F3F9E', '#B9BDB8'];
const GLSL_EASE = /* glsl */`
  float sqEase(float k){ k = clamp(k, 0., 1.); return k * k * (3. - 2. * k); }
  float sqBack(float k){ k = clamp(k, 0., 1.) - 1.; return 1. + 2.4 * k * k * k + 1.4 * k * k; }  // settles with a slight overshoot
  float sqHash(float n){ return fract(sin(n * 12.9898 + 4.137) * 43758.5453); }`;

// hex -> the linear value that comes out of the post chain (ACES at exposure e, neutral grade) as that hex
function inkACES(hex, e) {
  const inM = [[.59719, .35458, .04823], [.07600, .90834, .01566], [.02840, .13383, .83777]];
  const outM = [[1.60475, -.53108, -.07367], [-.10208, 1.10813, -.00605], [-.00327, -.07276, 1.07602]];
  const mul = (m, v) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const fit = (v) => v.map((x) => (x * (x + .0245786) - .000090537) / (x * (.983729 * x + .4329510) + .238081));
  const t = new THREE.Color(hex), want = [t.r, t.g, t.b]; let c = want.slice();
  for (let i = 0; i < 300; i++) {
    const o = mul(outM, fit(mul(inM, c.map((x) => x * e / 0.6))));
    c = c.map((x, k) => Math.min(6, Math.max(0, x + (want[k] - Math.min(1, Math.max(0, o[k]))) * 0.6)));
  }
  return new THREE.Color().setRGB(c[0], c[1], c[2], THREE.LinearSRGBColorSpace);
}

// a linear colour mixed for the tone-mapped pipeline -> the linear colour that pipeline showed (what a flat world writes)
function shownACES(c, e) {
  const inM = [[.59719, .35458, .04823], [.07600, .90834, .01566], [.02840, .13383, .83777]];
  const outM = [[1.60475, -.53108, -.07367], [-.10208, 1.10813, -.00605], [-.00327, -.07276, 1.07602]];
  const mul = (m, v) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const fit = (v) => v.map((x) => (x * (x + .0245786) - .000090537) / (x * (.983729 * x + .4329510) + .238081));
  const o = mul(outM, fit(mul(inM, [c.r, c.g, c.b].map((x) => x * e / 0.6)))).map((x) => Math.min(1, Math.max(0, x)));
  return new THREE.Color().setRGB(o[0], o[1], o[2], THREE.LinearSRGBColorSpace);
}

export function makeStyle(ctx, opts = {}) {
  const P = opts.palette || PALETTE, e = opts.exposure || 1;
  // opts.flat: the world shows its paint without the tone map (post.flat 1), so a hex is written as itself
  const ink = opts.flat ? (hex) => new THREE.Color(hex) : inkACES;
  const tintTo = (hex, level) => { const c = new THREE.Color(hex); const m = Math.max(c.r, c.g, c.b); return new THREE.Color().setRGB(c.r / m * level, c.g / m * level, c.b / m * level, THREE.LinearSRGBColorSpace); };
  const mid = '#' + new THREE.Color(P[0]).lerp(new THREE.Color(P[1]), 0.5).getHexString();
  const pal = {
    black: ink(P[2], e), red: ink(P[3], e), yellow: ink(P[4], e), blue: ink(P[5], e), grey: ink(P[6], e),
    grey1: ink('#565856', e), grey2: ink('#878a86', e),              // the two steps between black and pale grey
    whiteWarm: ink(P[0], e), whiteCool: ink(P[1], e), whiteBright: ink(opts.bright || '#FBFBF8', e),
  };
  // opts.flat: palA keeps the tone-mapped mixes and shown() turns any colour derived from them (a paint times a
  // factor, a hand-mixed dark) into the colour to write, so tones the world mixes itself look as they did before
  const palA = {}; for (const k of Object.keys(pal)) palA[k] = opts.flat ? inkACES({ black: P[2], red: P[3], yellow: P[4], blue: P[5], grey: P[6], grey1: '#565856', grey2: '#878a86', whiteWarm: P[0], whiteCool: P[1], whiteBright: opts.bright || '#FBFBF8' }[k], e) : pal[k].clone();
  const shown = (c) => (opts.flat ? shownACES(c, e) : c);
  const U = { uTime: { value: 0 }, uBeat: { value: 0.45 }, uFront: { value: -1e4 }, uTrunk: { value: 0 }, uFarK: { value: 1 }, uCut: { value: 1e9 }, uCutW: { value: 1e9 }, uPart: { value: 0 }, uShut: { value: 0 }, uUndo: { value: 0 }, uFlown: { value: 0 }, uLate: { value: 1 },
    uGrey1: { value: pal.grey1 }, uGrey2: { value: pal.grey2 }, uGrey3: { value: pal.grey } };

  const flat = (color, o = {}) => new THREE.ShaderMaterial({
    uniforms: { uCol: { value: color } }, side: o.side ?? THREE.FrontSide,
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.); }' });

  const boxMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      attribute vec3 iPos, iSize, iCol, iEdge, iSlide; attribute vec4 iAnim;   // iAnim: mode, param, thin axis, far flag
      uniform float uTime, uBeat, uFront, uFarK, uCut, uCutW, uShut, uUndo, uLate, uFlown; uniform vec3 uGrey1, uGrey2, uGrey3; varying vec3 vCol;
      ${GLSL_EASE}
      void main(){
        vec3 c = iPos, sz = iSize; float mode = iAnim.x, par = iAnim.y, s = 0.;
        float dcam = distance((modelMatrix * vec4(iPos, 1.)).xyz, cameraPosition);
        if (mode > 3.5) {                                   // drawn out of one side, over 16 m of flight, once the metres flown (uFlown) pass par (item.metre): a place of the course, in metres of the route
          s = 1. - sqBack((uFlown - par) / 16.); c -= iSlide * s * .5; sz = max(sz - abs(iSlide) * s, vec3(0.)) * step(s, .999);
          if (mode > 4.2) {                                 // ...and afterwards keeps working like a drawer, now and then
            float per = 9. + 9. * sqHash(par * 3.1), t = mod(uTime + par * 1.7, per);
            c += iSlide * .4 * (sqBack(t / 1.8) - sqBack((t - per * .45) / 1.8)) * step(s, .01);
          }
          s = 0.;
        } else if (mode > 2.5) {                                   // shuttle: one cell per beat, waits 1-3 beats, off the beat 1 in 4
          float b = uTime / max(uBeat, .05) + par * 37.; float n = floor(b), f = b - n, cell = 0., go = 0.;
          float lift = step(.5, abs(iSlide.y)), wait = 2. - lift + floor(sqHash(par * 91.) * (3. - lift));   // riders on a shaft keep moving
          cell = floor(n / wait); go = step(wait - 1., mod(n, wait));
          float off = step(.75, sqHash(par * 13. + cell)) * .5;
          float wr = floor(par) < .5 ? 24. : floor(par) * 2.;      // the whole part of the phase, if any, is half the number of cells before it wraps
          s = mod(cell, wr) - wr * .5 + go * sqEase((f - off) / .4);
        } else if (mode > 1.5) {                            // drawn out of its slot as the front passes: one edge stays put
          s = 1. - sqBack((uFront - par) / 14.); c -= iSlide * s * .5; sz = max(sz - abs(iSlide) * s, vec3(0.)) * step(s, .999);
          if (mode > 2.2) {                                 // ...and afterwards keeps working like a drawer, now and then
            float per = 9. + 9. * sqHash(par * 3.1), t = mod(uTime + par * 1.7, per);
            c += iSlide * .4 * (sqBack(t / 1.8) - sqBack((t - per * .45) / 1.8)) * step(s, .01);
          }
          s = 0.;
        }
        else if (mode > .5) {                               // drawer: in, rest, out, rest, hashed period
          float per = 11. + 7. * sqHash(par * 57.), t = mod(uTime + par * per, per), d = 2. + 1.6 * sqHash(par * 7.);
          s = sqBack(t / d) - sqBack((t - per * .5) / d);
        }
        c += iSlide * s;
        // iAnim.w = far (1) + keep (2) + wedge (4): far bars step to grey; keep is exempt from the fog cut; wedge
        // boxes (those behind the Tree as seen from the sea) have their own cut distance and are never exempt
        // + bold (8): a bar of a wall that faces the course keeps a width on the canvas (never a hairline); + left (16):
        // the city to the left of the Tree, which is drawn back into one edge while the lift rises (uShut) and out again
        float isFar = step(.5, mod(iAnim.w, 2.)), isKeep = step(1.5, mod(iAnim.w, 4.)), isWedge = step(3.5, mod(iAnim.w, 8.)), isBold = step(7.5, mod(iAnim.w, 16.)), isLeft = step(15.5, mod(iAnim.w, 32.)), isNear = step(31.5, mod(iAnim.w, 64.)), isUndo = step(63.5, mod(iAnim.w, 128.)), isPos = step(127.5, mod(iAnim.w, 256.)), isLate = step(511.5, iAnim.w);
        if (isLate > .5) sz *= uLate;                                                           // + late (512): the crowd of an avenue that is ruled late stands up with it (style.U.uLate)
        if (isFar > .5 && sz.x * sz.y * sz.z > 0.) sz = max(sz, vec3(dcam * .0046));            // a far bar is widened to stay a line, never thinned to a shimmer
        if (isBold > .5 && sz.x * sz.y * sz.z > 0.) sz = max(sz, vec3(dcam * .011));
        // + undo (64): a ground line ruled out again (style.U.uUndo) before it would be seen lengthwise; + left (16): see above.
        // + near (32) THE DRAWER'S RULE, in space: a plane begins to draw shut into one edge when the lens comes within
        // 2.6 times its own larger side and has clicked shut at 1.8 times; it opens again behind us by the same rule.
        // The same two numbers for every plane that carries the flag. + pos (128): the edge it shuts into is its positive end.
        float bigN = max(iSize.x, max(iSize.y, iSize.z)), nearK = isNear * sqEase(1. - (dcam / max(bigN, 1.) - 1.8) / .8), shutK = max(isLeft * uShut, isUndo * uUndo);
        if (shutK > 0. || nearK > 0.) {
          float hh = sqHash(iPos.x * .37 + iPos.z * .11 + iPos.y * .23), sh = max(sqEase(shutK * 1.5 - hh * .5) * step(.0001, shutK), nearK);
          vec3 la = (sz.x >= sz.y && sz.x >= sz.z) ? vec3(1., 0., 0.) : (sz.y >= sz.z ? vec3(0., 1., 0.) : vec3(0., 0., 1.));
          float into = isNear > .5 ? (isPos > .5 ? -.5 : .5) : (hh > .5 ? .5 : -.5);
          c -= la * sz * sh * into; sz = (sz - la * sz * sh) * step(sh, .999);
        }
        if (dcam > (isWedge > .5 ? uCutW : uCut) && (isKeep < .5 || isWedge > .5)) sz = vec3(0.);   // left out, never faded
        vec4 wp = modelMatrix * vec4(c + position * sz, 1.);
        vec3 n = abs(normal); float thin = iAnim.z < .5 ? n.x : (iAnim.z < 1.5 ? n.y : n.z);
        vCol = mix(iEdge, iCol, step(.5, thin));
        if (isFar > .5) { float d = distance((modelMatrix * vec4(c, 1.)).xyz, cameraPosition);     // (not scaled by uFarK: in fog the cut distance does the work, and a bar within 320 m is black)
          vCol = d > 700. ? uGrey3 : (d > 500. ? uGrey2 : (d > 320. ? uGrey1 : vCol)); }
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: 'varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }' });

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  function boxes(items, o = {}) {
    const n = items.length, g = new THREE.InstancedBufferGeometry();
    g.index = unitBox.index; g.setAttribute('position', unitBox.attributes.position); g.setAttribute('normal', unitBox.attributes.normal);
    const pos = new Float32Array(n * 3), siz = new Float32Array(n * 3), col = new Float32Array(n * 3), edg = new Float32Array(n * 3), sli = new Float32Array(n * 3), ani = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const it = items[i], s = it.s, e = it.edge || it.c, v = it.slide || it.hop;
      const j = i * 3, p = it.p, c = it.c;
      pos[j] = p[0]; pos[j + 1] = p[1]; pos[j + 2] = p[2]; siz[j] = s[0]; siz[j + 1] = s[1]; siz[j + 2] = s[2];
      col[j] = c.r; col[j + 1] = c.g; col[j + 2] = c.b; edg[j] = e.r; edg[j + 1] = e.g; edg[j + 2] = e.b;
      if (v) { sli[j] = v[0]; sli[j + 1] = v[1]; sli[j + 2] = v[2]; }
      ani[i * 4] = it.metre !== undefined ? (it.drawer ? 4.4 : 4) : it.hop ? 3 : (it.key !== undefined ? (it.drawer ? 2.4 : 2) : (it.slide ? 1 : 0));
      ani[i * 4 + 1] = it.metre !== undefined ? it.metre : it.key !== undefined ? it.key : (it.phase || 0);
      ani[i * 4 + 2] = s[0] <= s[1] && s[0] <= s[2] ? 0 : (s[1] <= s[2] ? 1 : 2);
      ani[i * 4 + 3] = (it.far ? 1 : 0) + (it.keep ? 2 : 0) + (it.wedge ? 4 : 0) + (it.bold ? 8 : 0) + (it.left ? 16 : 0) + (it.near ? 32 : 0) + (it.undo ? 64 : 0) + (it.nearPos ? 128 : 0) + (it.late ? 512 : 0);
    }
    const A = (a, k) => new THREE.InstancedBufferAttribute(a, k);
    g.setAttribute('iPos', A(pos, 3)); g.setAttribute('iSize', A(siz, 3)); g.setAttribute('iCol', A(col, 3));
    g.setAttribute('iEdge', A(edg, 3)); g.setAttribute('iSlide', A(sli, 3)); g.setAttribute('iAnim', A(ani, 4));
    g.instanceCount = n;
    const m = new THREE.Mesh(g, o.material || boxMat); m.frustumCulled = false; return m;
  }
  // a bar between two axis-aligned points; it overruns each end by half its width unless told to stop short
  const bar = (a, b, w, c, o = {}) => {
    const ext = o.ext ?? w, s = [Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2])];
    const ax = s[0] >= s[1] && s[0] >= s[2] ? 0 : (s[1] >= s[2] ? 1 : 2);
    const size = [w, w, w]; size[ax] = s[ax] + ext;
    return { p: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], s: size, c, far: o.far ?? true };
  };
  function sky() {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), flat(pal.whiteCool, { side: THREE.BackSide }));
    m.material.depthWrite = false; m.material.depthTest = false; m.renderOrder = -10; m.frustumCulled = false;
    m.follow = (camera) => { m.position.setFromMatrixPosition(camera.matrixWorld); m.scale.setScalar((camera.far || 4000) * 0.9); };
    return m;
  }
  return {
    pal, palA, shown, whites: [pal.whiteWarm, pal.whiteCool, pal.whiteBright], W: { thin: 0.6, thick: 2.4 }, CELL: 6, U,
    flat, boxMat, boxes, bar, sky, glsl: { ease: GLSL_EASE },
    update(dt, time) { U.uTime.value = time; },
  };
}

// ------------------------------------------------------------------------------------------------ the Tree
const snap = (v, c) => Math.round(v / c) * c;
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], l2 = dx * dx + dy * dy + dz * dz;
  let t = l2 > 0 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy + (p[2] - a[2]) * dz) / l2 : 0; t = Math.min(1, Math.max(0, t));
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t, p[2] - a[2] - dz * t);
}
function lineDist(p, line) { let d = 1e9; for (let i = 0; i + 1 < line.length; i++) d = Math.min(d, segDist(p, line[i], line[i + 1])); return d; }

// One limb in its two shapes. A = the grey curve (heading integrated in 3 m steps: it arcs out, is swept by the
// wind and droops like blown hair); B = the same limb as a staircase of axis runs on a lattice of `cell` metres.
// Both are returned with the SAME sample count, every stair run made of whole samples, so segment i of the curve
// becomes segment i of the stair.
function growLimb(noise, o) {
  const n = Math.max(3, Math.ceil(o.len / 3)), pts = [o.a0.slice()], p = o.a0.slice(), h = o.dir.slice(), ns = o.seed;
  for (let i = 1; i <= n; i++) {
    const f = i / n, turn = (o.droop / n) * 3 * f * f;
    h[1] -= turn; h[0] += o.wind[0] * o.sweep * f * 3 / o.len * 2; h[2] += o.wind[1] * o.sweep * f * 3 / o.len * 2;
    h[0] += noise.n3(p[1] * 0.021 + ns, p[2] * 0.021, ns) * o.curl; h[2] += noise.n3(p[0] * 0.021, ns, p[1] * 0.021 + ns) * o.curl;
    h[1] += noise.n3(ns, p[0] * 0.017 + ns, p[2] * 0.017) * o.curl * 0.6;
    if (p[1] < o.floorY + 14 && h[1] < 0.1) h[1] += 0.22 * (1 - (p[1] - o.floorY) / 14);   // hair ends flick level above the fork
    if (p[1] > o.ceilY - 12 && h[1] > 0) h[1] -= 0.2;
    const l = Math.hypot(h[0], h[1], h[2]) || 1; h[0] /= l; h[1] /= l; h[2] /= l;
    p[0] += h[0] * 3; p[1] += h[1] * 3; p[2] += h[2] * 3; pts.push(p.slice());
  }
  // staircase: follow the curve (shifted to start at b0) from lattice point to lattice point by axis moves
  const off = [o.b0[0] - o.a0[0], o.b0[1] - o.a0[1], o.b0[2] - o.a0[2]], C = [o.b0.slice()], c = o.b0.slice(); let lastAx = -1;
  for (let i = 1; i <= n; i++) {
    const q = [snap(pts[i][0] + off[0], o.cell), Math.max(snap(pts[i][1] + off[1], o.cell), o.minY), snap(pts[i][2] + off[2], o.cell)];
    const ax = [0, 1, 2].filter((k) => Math.abs(q[k] - c[k]) > 0.01).sort((u, v) => (v === lastAx) - (u === lastAx) || Math.abs(q[v] - c[v]) - Math.abs(q[u] - c[u]));
    for (const k of ax) {
      const back = C.length > 1 && lastAx === k;
      c[k] = q[k];
      if (back) C[C.length - 1] = c.slice(); else C.push(c.slice());
      lastAx = k;
    }
  }
  if (C.length < 2) return null;
  // resample both: every run in whole pieces of about 3.5 m; the curve by the same fraction of its length
  const B = [C[0].slice()], lat = [true], cum = [0]; let Ls = 0;
  for (let j = 0; j + 1 < C.length; j++) {
    const a = C[j], b = C[j + 1], r = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (r < 0.01) continue;
    const m = Math.max(1, Math.round(r / 3.5));
    for (let k = 1; k <= m; k++) {
      const t = k / m, q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      B.push(q); Ls += r / m; cum.push(Ls);
      lat.push(Math.abs(q[0] / 6 - Math.round(q[0] / 6)) + Math.abs(q[1] / 6 - Math.round(q[1] / 6)) + Math.abs(q[2] / 6 - Math.round(q[2] / 6)) < 0.01);
    }
  }
  const A = B.map((_, i) => {
    const t = Math.min(n - 1e-4, (cum[i] / Math.max(Ls, 1e-3)) * n), k = Math.floor(t), u = t - k, a = pts[k], b = pts[k + 1];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  });
  return { A, B, lat };
}

export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, { palette: opts.palette });
  const rng = ctx.rng.fork ? ctx.rng.fork('the-tree') : ctx.rng, noise = ctx.noise, detail = opts.detail ?? 1, pal = style.pal;
  const clear = opts.clear ?? 7.5, TILT = opts.tilt ?? 0.3, LAG = opts.paneLag ?? 27, FORK = 40, TOP = 186;
  const corridor = opts.corridor || [[27, 5, 190], [27, 5, 58], [27, 106, 10.9], [27, 106, -170]];
  // per-seed character: where the wind comes from, how far the trunk leans, how the hair falls
  const windA = rng.range(-0.55, 0.55) + (rng.chance(0.35) ? Math.PI : 0), wind = [-Math.cos(windA), Math.sin(windA) * 0.6];
  const lean = rng.range(9, 15), weep = rng.range(0.75, 1.3), nMain = rng.int(9, 12);
  const group = new THREE.Group(); group.name = 'the-tree';

  const S = { a0: [], a1: [], b0: [], b1: [], w: [], k: [], e: [], f: [] }, limbs = [];
  // THE PARTING. What stands between the lift line and the trunk, below the level leg, draws aside as the lift starts
  // (style.U.uPart, 0..1, set by the world), so the five trunk bars stand clear of the cage: a convex wedge in plan
  // from the lift leg of the corridor to the trunk, less the trunk's own footing.
  const cl0 = corridor[1] || [27, 5, 58], cl1 = corridor[2] || [27, 106, 11], WEDGE = [[cl0[0] + 3, cl0[2] + 3], [cl1[0] + 3, cl1[2] - 4], [11, -11], [-11, -11], [-11, 11]];
  // opts.keepOut: boxes [[x0, y0, z0], [x1, y1, z1]] (local) where the world stands something of its own in the squared
  // Tree (the standing grid at the level-off): no staircase run and no pane is drawn there; the curves are untouched
  const KO = opts.keepOut || [], inKO = (p) => { for (const b of KO) if (p[0] > b[0][0] && p[0] < b[1][0] && p[1] > b[0][1] && p[1] < b[1][1] && p[2] > b[0][2] && p[2] < b[1][2]) return true; return false; };
  // opts.noStair: boxes like keepOut, but the curves there stay until the front paints them out: only the staircase
  // (and so its panes) is left out. The world uses it behind its one large limb, which must stand against white.
  const NOST = opts.noStair || [], inNS = (p) => { for (const b of NOST) if (p[0] > b[0][0] && p[0] < b[1][0] && p[1] > b[0][1] && p[1] < b[1][1] && p[2] > b[0][2] && p[2] < b[1][2]) return true; return false; };
  // opts.sight: [{ rect: [x0, y0, x1, y1, z], eyes: [[x, y, z], ...] }] (local): a plane of the world's composition and
  // the places it is looked at from. Whatever of the SQUARED Tree would stand between an eye and that plane is left out
  // (no staircase run, no pane, no square dab), so a plane of paint is never speckled; the curves stay until corrected.
  const SIGHT = opts.sight || [], inSight = (p) => {
    for (const S of SIGHT) { const r = S.rect; if (p[2] <= r[4]) continue;
      for (const e of S.eyes) { const dz = p[2] - e[2]; if (dz > -0.5) continue; const t = (r[4] - e[2]) / dz, x = e[0] + (p[0] - e[0]) * t, y = e[1] + (p[1] - e[1]) * t;
        if (x > r[0] - 3.5 && x < r[2] + 3.5 && y > r[1] - 3.5 && y < r[3] + 3.5) return true; } }
    return false;
  };
  const inWedge = (p) => {
    if (p[1] > cl1[1] - 10 || Math.hypot(p[0], p[2]) < 15) return false;
    let sg = 0;
    for (let i = 0; i < 5; i++) { const a = WEDGE[i], b = WEDGE[(i + 1) % 5], c = (b[0] - a[0]) * (p[2] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); if (Math.abs(c) < 1e-9) continue; if (sg && Math.sign(c) !== sg) return false; sg = Math.sign(c); }
    return true;
  };
  function addLimb(limb, o) {
    if (!limb) return null;
    let m = limb.A.length;
    // Near the cage a line is drawn in line, not in mass: a stroke may come within `clear` of the camera line but
    // it thins as it comes (never more than about 4 percent of its distance), and a staircase run is a thick bar
    // only where it stands at least 70 m off; closer, the same run is a thin bar.
    const dA = [], dB = [], wA = (i) => o.wa0 + (o.wa1 - o.wa0) * (i / Math.max(1, limb.A.length - 1));
    for (let i = 0; i < m; i++) {
      dA.push(lineDist(limb.A[i], corridor)); dB.push(lineDist(limb.B[i], corridor));
      if (!o.trunk && (dA[i] < clear + 1 || dB[i] < clear + 2.5)) { m = i; break; }
    }
    if (m < 3) return null;
    // a stroke tapers to its tip like a brush leaving the paper; two limbs in three of the finer ones are SHY: drawn
    // from afar, left out near the cage (the curve inside a distance of the camera, in the shader, once the lift has begun; the stair within 26 m
    // of the camera line), so that the near crown is a few lines against open white and never a mass
    const waAt = (i) => (o.trunk ? wA(i) : Math.min(wA(i), Math.max(0.3, 0.042 * dA[i])) * Math.min(1, 0.2 + (m - 1 - i) / 4));
    const shy = !o.trunk && o.level > 0 && (limbs.length * 0.6180339887) % 1 > 0.34 ? 1 : 0;
    // the hand: at every corner of the staircase the runs either cross and overrun, or one stops short of the other
    const B = limb.B, turn = (i) => i > 0 && i < m - 1 && Math.abs((B[i][0] - B[i - 1][0]) * (B[i + 1][0] - B[i][0]) + (B[i][1] - B[i - 1][1]) * (B[i + 1][1] - B[i][1]) + (B[i][2] - B[i - 1][2]) * (B[i + 1][2] - B[i][2])) < 0.01;
    let e0 = o.trunk ? 0 : o.wb * 0.5 + rng.range(0.6, 2.2); const vis = [];
    for (let i = 0; i + 1 < m; i++) {
      let e1 = 0.02, n0 = 0.02;
      if (turn(i + 1)) { const cross = rng.chance(0.55), over = rng.range(1.1, 2.6); e1 = cross ? o.wb * 0.5 + over : -(o.wb * 0.5 + 0.8); n0 = o.wb * 0.5 + (cross ? rng.range(1.1, 2.6) : over); }
      else if (i + 2 === m) e1 = o.trunk ? o.wb * 0.5 + 1.5 : 0;
      S.e.push(e0, e1); e0 = n0;
      const f0 = i / (m - 1), f1 = (i + 1) / (m - 1), b0 = limb.B[i], b1 = limb.B[i + 1];
      S.a0.push(...limb.A[i]); S.a1.push(...limb.A[i + 1]); S.b0.push(...b0); S.b1.push(...b1);
      const nb = Math.min(dB[i], dB[i + 1]), wdg = !o.trunk && (inWedge(limb.A[i]) || inWedge(limb.A[i + 1]) || inWedge(b0) || inWedge(b1) || inKO(b0) || inKO(b1)) ? 1 : 0;   // (a stroke with no staircase to become parts too)
      // ...and beside the level leg no run stands within 19 m, so no bar there is thicker than a cage bar
      const under = b0[1] < cl1[1] - 2 && b1[1] < cl1[1] - 2 && b0[2] < cl1[2] + 14;   // below the level leg, ahead of the lift's last third
      const sgt = !o.trunk && (inSight(b0) || inSight(b1)), zRun = Math.abs(b1[2] - b0[2]) > Math.abs(b1[0] - b0[0]) + Math.abs(b1[1] - b0[1]);
      const out = !o.trunk && (inKO(b0) || inKO(b1) || inNS(b0) || inNS(b1) || sgt || (zRun && nb < 85) || (nb < (shy ? 28 : 20)) || (under && nb < 22)
        // A BOLD LATTICE: the twigs are corrected away, not squared, and below the level leg ahead of us the far runs are
        // left to the world's standing grid, so the squared Tree is few bars, not a thicket
        || o.level === 2 || (under && Math.max(b0[1], b1[1]) < 84));
      vis.push(!out);
      // DRAWN IN LINE. Inside the crown a staircase is a fine black line, not a beam: a bar is as wide as half a percent
      // of its distance from the cage's line (a thick one not quite twice that), and takes its full 0.6 or 2.4 m only from
      // 125 m off, where the widths read as widths. Bars widen with distance, as the far ones always have.
      // TWO WEIGHTS, as painted: the third number is the bar's class (0 left out, 0.6 thin, 2.4 thick; the trunk's is its
      // real width) and the shader gives each class one width on the canvas, so no run is ever a hairline or a beam
      S.w.push(waAt(i), waAt(i + 1), out ? 0 : (o.trunk ? o.wb : (o.wb > 1 && o.level === 0 && nb >= 40 ? 2.4 : 0.6)));
      S.f.push(o.trunk || o.level === 0 ? 0 : (o.level === 1 ? (shy ? 56 : 0) : (shy ? 84 : 46)), wdg);   // the distance inside which the curved stroke is left out
      S.k.push(o.trunk ? (b0[1] + b1[1]) * 0.5 : Math.min(sgt ? 96 : 1e9, (b0[1] + b1[1]) * 0.5 + TILT * (b0[2] + b1[2]) * 0.5), o.trunk ? 1 : (o.level === 0 ? 2 : 0));
    }
    const rec = { A: limb.A, B: limb.B, lat: limb.lat, m, level: o.level, wb: o.wb, trunk: !!o.trunk, vis }; limbs.push(rec); return rec;
  }
  const heading = (L, i) => { const a = L.A[Math.max(0, i - 1)], b = L.A[Math.min(L.m - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l]; };

  // TRUNK: five strokes that lean together as one grey trunk 14 m thick and click into five upright bars
  const plan = [[-8.1, 8.9], [-4.7, 3.8], [0.4, 0.4], [3.8, -4.7], [8.9, -8.1]],   // a staggered row square to the cage's line of sight
   trunks = [], tops = rng.shuffle([42, 54, 66, 78, 90]);   // no two bars cover each other from any side
  for (let t = 0; t < 5; t++) {
    const H = tops[t], n = H / 3, A = [], B = [], lat = [], ph = rng.range(0, 6.28), px = plan[t][0], pz = plan[t][1];
    for (let i = 0; i <= n; i++) {
      const f = i / n, y = i * 3, s = Math.pow(y / 90, 1.5) * lean * 1.25, wob = Math.sin(f * 3.2 + ph) * 1.6 * f;
      A.push([px * 0.55 * (1 - 0.3 * f) + wind[0] * s + wob, y * 0.97, pz * 0.55 * (1 - 0.3 * f) + wind[1] * s - wob * 0.5]);
      B.push([px, i === 0 ? -5 : y, pz]); lat.push(i % 2 === 0);
    }
    trunks.push(addLimb({ A, B, lat }, { level: 0, wa0: 5.4, wa1: 3.4, wb: 2.4, trunk: true }));
  }
  // MAIN BOUGHS: one from every trunk top and a few from the upper trunk; out, over and down like blown hair
  const mains = [], az0 = rng.range(0, 6.28), total = 5 + nMain;
  for (let b = 0; b < total; b++) {
    const T = trunks[b % 5], i = b < 5 ? T.m - 1 : Math.min(T.m - 1, 2 * rng.int(5, Math.floor((T.m - 1) / 2)));
    const az = az0 + (b / total) * 6.283 * 2.618 + rng.range(-0.3, 0.3), el = 0.45 + 1.0 * ((b * 0.618 + rng.range(0, 0.25)) % 1), ce = Math.cos(el);
    const len = rng.range(110, 150);
    const limb = growLimb(noise, { a0: T.A[i], b0: T.B[i], dir: [ce * Math.cos(az), Math.sin(el), ce * Math.sin(az)], len, cell: 18, minY: 36,
      floorY: FORK, ceilY: TOP, wind, sweep: rng.range(0.5, 1.2), droop: el + rng.range(0.25, 0.95) * weep, curl: 0.045, seed: rng.range(0, 90) });
    const rec = addLimb(limb, { level: 0, wa0: 4.0, wa1: 1.3, wb: 2.4 }); if (rec) mains.push(rec);
    await ctx.yield();
  }
  await ctx.yield();
  // BRANCHES and TWIGS: children leave only from lattice points of the parent, so the staircases share corners
  async function children(parents, o) {
    const out = []; let np = 0;
    for (const P of parents) {
      await ctx.yield();
      let next = o.first + rng.range(0, o.gap), side = rng.chance(0.5) ? 1 : -1, run = 0;
      for (let i = 2; i < P.m - 1; i++) {
        run += Math.hypot(P.B[i][0] - P.B[i - 1][0], P.B[i][1] - P.B[i - 1][1], P.B[i][2] - P.B[i - 1][2]);
        if (run < next || !P.lat[i]) continue;
        next = run + o.gap * rng.range(0.7, 1.5); side = -side;
        const h = heading(P, i), f = i / P.m, up = rng.range(-0.15, 0.6), th = rng.range(0, 6.28);
        let px = -h[2] * side + Math.cos(th) * 0.35, pz = h[0] * side + Math.sin(th) * 0.35;
        const d = [px * 0.85 + h[0] * 0.45, up + h[1] * 0.3, pz * 0.85 + h[2] * 0.45], l = Math.hypot(d[0], d[1], d[2]) || 1;
        const len = rng.range(o.len[0], o.len[1]) * (1 - 0.45 * f), thick = rng.chance(o.thick);
        const limb = growLimb(noise, { a0: P.A[i], b0: P.B[i], dir: [d[0] / l, d[1] / l, d[2] / l], len, cell: o.cell, minY: 36, floorY: FORK, ceilY: TOP,
          wind, sweep: rng.range(0.3, 0.9), droop: rng.range(0.5, 1.5) * weep, curl: 0.06, seed: rng.range(0, 90) });
        const rec = addLimb(limb, { level: o.level, wa0: o.w[0], wa1: o.w[1], wb: thick ? 2.4 : 0.6 }); if (rec) out.push(rec);
        await ctx.yield();
      }
    }
    return out;
  }
  const branches = await children(mains, { level: 1, cell: 12, first: 12, gap: 10, len: [30, 60], w: [1.9, 0.7], thick: 0.1 });
  await ctx.yield();
  const twigs = await children(branches, { level: 2, cell: 6, first: 7, gap: 9, len: [10, 24], w: [0.9, 0.45], thick: 0 });
  await ctx.yield();
  const nSeg = S.k.length / 2;

  // ---- the limbs: one instanced square-section ribbon, two stored shapes per segment
  const U = style.U, HU = { uTrunk: U.uTrunk, uFront: U.uFront, uTime: U.uTime, uPart: U.uPart, uFarK: U.uFarK, uGrey1: U.uGrey1, uGrey2: U.uGrey2, uGrey3: U.uGrey3,
    uGrey: { value: opts.evening ? pal.red : pal.grey }, uBough: { value: opts.evening ? pal.red : ((opts.oneGrey ?? true) ? pal.grey : pal.grey2) }, uBlack: { value: pal.black },
    uWhite: { value: opts.petal || (opts.season === 'bare' ? pal.grey : pal.whiteWarm) }, uWhiteB: { value: opts.petalSquare || (opts.season === 'fruit' ? pal.red : (opts.season === 'bare' ? pal.grey : pal.whiteWarm)) }, uHeron: { value: opts.herons ? 1 : 0 }, uTilt: { value: TILT }, uBird: { value: opts.oneGrey ? pal.grey : pal.grey2 }, uWind: { value: new THREE.Vector2(wind[0], wind[1]) } };
  const GL = style.glsl.ease + /* glsl */`
    uniform float uFront, uTrunk, uTime, uFarK, uTilt, uPart; uniform vec2 uWind; uniform vec3 uGrey, uBough, uBlack, uWhite, uGrey1, uGrey2, uGrey3;
    vec3 sway(vec3 p){ float a = max(p.y - 30., 0.) * .014; float s = sin(uTime * .9 + p.x * .031 + p.z * .027) + .5 * sin(uTime * 1.7 + p.y * .06);
      return vec3(uWind.x * s * a, -.35 * a * abs(s), uWind.y * s * a); }
    float click(vec2 k){ return abs(k.y - 1.) < .5 ? clamp(uTrunk * 1.5 - k.x / 180., 0., 1.) : clamp((uFront - k.x) / 4.5, 0., 1.); }
    vec3 farInk(vec3 c, float d){ d /= uFarK; return d > 700. ? uGrey3 : (d > 500. ? uGrey2 : (d > 320. ? uGrey1 : c)); }`;
  const box = new THREE.BoxGeometry(1, 1, 1), sg = new THREE.InstancedBufferGeometry();
  sg.index = box.index; sg.setAttribute('position', box.attributes.position);
  const IA = (a, k) => new THREE.InstancedBufferAttribute(new Float32Array(a), k);
  sg.setAttribute('iA0', IA(S.a0, 3)); sg.setAttribute('iA1', IA(S.a1, 3)); await ctx.yield();
  sg.setAttribute('iB0', IA(S.b0, 3)); sg.setAttribute('iB1', IA(S.b1, 3));
  sg.setAttribute('iW', IA(S.w, 3)); sg.setAttribute('iE', IA(S.e, 2)); sg.setAttribute('iF', IA(S.f, 2)); sg.setAttribute('iK', IA(S.k, 2)); sg.instanceCount = nSeg;
  const limbMat = new THREE.ShaderMaterial({ uniforms: HU,
    vertexShader: /* glsl */`
      attribute vec3 iA0, iA1, iB0, iB1, iW; attribute vec2 iK, iE, iF; varying vec3 vCol;
      ${GL}
      vec3 place(vec3 p0, vec3 p1, float w, vec2 ext){
        vec3 d = p1 - p0; float l = length(d); d = l > 1e-3 ? d / l : vec3(0., 1., 0.);
        vec3 ref = abs(d.y) > .92 ? vec3(1., 0., 0.) : vec3(0., 1., 0.);
        vec3 s = normalize(cross(d, ref)), u = cross(s, d);
        return mix(p0, p1, position.z + .5) + d * (position.z < 0. ? -ext.x : ext.y) + (s * position.x + u * position.y) * w;
      }
      void main(){
        float t = position.z + .5, k = click(iK), m = sqBack(k);
        vec3 mid = mix(mix(iA0, iA1, .5), mix(iB0, iB1, .5), m);
        float dist = distance((modelMatrix * vec4(mid, 1.)).xyz, cameraPosition), wmin = dist * .0026, wminA = dist * mix(.0026, .006, sqEase(uPart));
        // drawn in line, not in mass: seen from close a curved stroke is never wider than about 0.9 percent of its
        // distance (its full width only from 130 m and more); shy strokes are left out within 24-42 m; the wedge parts
        float part = sqEase(uPart), nt = step(.5, abs(iK.y - 1.)), cap = dist * mix(.0088, .042, smoothstep(45., 130., dist) * (1. - .93 * part));
        float gone = (1. - step(.5, iF.x) * (1. - smoothstep(max(iF.x, 1.) * .6, max(iF.x, 1.), dist))) * (1. - iF.y * part);
        float wa0 = mix(iW.x, iW.y, t), wa = max(mix(wa0, min(wa0, cap), nt), wminA) * mix(gone, step(.5, gone), sqEase(uPart)),   /* once the lift has started a stroke is whole or left out, never thinned (a shy stroke half gone was a 1 px hairline) */ wb = max(nt > .5 ? (iW.z > 1. ? clamp(dist * .022, .8, 2.6) : clamp(dist * .009, .3, 1.2)) : iW.z, wmin) * step(.01, iW.z) * (1. - iF.y * part);
        // a stroke with no staircase to become (a twig that is corrected away) keeps its width while it snaps toward
        // its run and is then left out: thinned to nothing it was a 1 px hairline, level, a fifth of the frame long
        float outS = 1. - step(.01, iW.z); wa *= 1. - outS * step(.6, m); wb = mix(wb, wa, outS);
        vec3 a = place(iA0 + sway(iA0), iA1 + sway(iA1), wa, vec2(wa * .3));
        vec3 b = place(iB0, iB1, wb, iE);
        vCol = k > .5 ? farInk(uBlack, dist) : (iK.y > .5 ? uBough : uGrey);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(a, b, m), 1.);
      }`,
    fragmentShader: 'varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }' });
  const limbMesh = new THREE.Mesh(sg, limbMat); limbMesh.frustumCulled = false; group.add(limbMesh);
  await ctx.yield();

  // ---- blossom: oval dabs fluttering on the curved boughs; each becomes a still white square with its bough
  const nPet = Math.round(6000 * detail), pa = [], pb = [], pk = [], pr = [], hosts = limbs.filter((l) => !l.trunk);
  const wts = hosts.map((l) => (l.m - 1) * (l.level === 0 ? 0.5 : 1)); let wsum = 0; for (const w of wts) wsum += w;
  for (let i = 0, guard = 0; i < nPet && guard < nPet * 3; guard++) {
    let r = rng() * wsum, li = 0; while (li < hosts.length - 1 && r > wts[li]) r -= wts[li++];
    const Lm = hosts[li], s = rng.int(0, Lm.m - 2), t = rng(), a0 = Lm.A[s], a1 = Lm.A[s + 1], b0 = Lm.B[s], b1 = Lm.B[s + 1];
    const ox = rng.gauss() * 1.6, oy = rng.gauss() * 1.3 - 0.8, oz = rng.gauss() * 1.6, ax = rng.int(0, 2), hsh = rng();
    const A = [a0[0] + (a1[0] - a0[0]) * t + ox, a0[1] + (a1[1] - a0[1]) * t + oy, a0[2] + (a1[2] - a0[2]) * t + oz];
    const Bp = [snap(b0[0] + (b1[0] - b0[0]) * t + ox * 1.4, 1.5) + 0.13, snap(b0[1] + (b1[1] - b0[1]) * t + oy * 1.4, 1.5) + 0.13, snap(b0[2] + (b1[2] - b0[2]) * t + oz * 1.4, 1.5) + 0.13];
    if (lineDist(A, corridor) < clear - 1 || lineDist(Bp, corridor) < clear - 1) continue;
    const psg = inSight(Bp) || inSight(A);
    pa.push(...A); pb.push(...Bp); pk.push(Math.min(psg ? 97 : 1e9, (b0[1] + b1[1]) * 0.5 + TILT * (b0[2] + b1[2]) * 0.5 + 1.5)); pr.push(rng.range(0, 6.283), hsh, (ax < 2 ? ax * 2 : (rng.chance(0.3) ? 1 : 2)) + (psg ? 4 : 0), rng.range(0.8, 1.25) * (inWedge(A) || inWedge(Bp) || inKO(Bp) ? -1 : 1));   // a negative size marks a dab that parts with the wedge
    i++;
    if (guard % 20 === 19) await ctx.yield();
  }
  const quad = new THREE.PlaneGeometry(2, 2), pg = new THREE.InstancedBufferGeometry();
  pg.index = quad.index; pg.setAttribute('position', quad.attributes.position);
  pg.setAttribute('iA', IA(pa, 3)); pg.setAttribute('iB', IA(pb, 3)); pg.setAttribute('iK', IA(pk, 1)); pg.setAttribute('iR', IA(pr, 4)); pg.instanceCount = pk.length;
  const petalMat = new THREE.ShaderMaterial({ uniforms: HU, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 iA, iB; attribute float iK; attribute vec4 iR; varying vec3 vP;
      ${GL}
      void main(){
        float k = click(vec2(iK, 0.)), m = sqEase(k), th = iR.x + sin(uTime * 2.6 + iR.y * 40.) * .5 * (1. - m), ph = (iR.y - .5) * 2.2 + sin(uTime * 3.4 + iR.y * 71.) * .7 * (1. - m);
        vec3 u = vec3(cos(th), 0., sin(th)), v = vec3(-sin(th) * sin(ph), cos(ph), cos(th) * sin(ph));
        vec3 a = iA + sway(iA) + (u * position.x * .85 + v * position.y * .5) * abs(iR.w);
        float sgt = step(3.5, iR.z), axz = iR.z - 4. * sgt;
        vec3 bu = axz < .5 ? vec3(0., 0., 1.) : vec3(1., 0., 0.), bv = abs(axz - 1.) < .5 ? vec3(0., 0., 1.) : vec3(0., 1., 0.);
        vec3 c = mix(iA, iB, m); float dist = distance((modelMatrix * vec4(c, 1.)).xyz, cameraPosition), g = max(1., dist * .0034);
        // a dab is never longer than about 3 percent of the frame: it shrinks as it nears, and none is drawn within 12 m
        g *= min(1., dist / 60.) * smoothstep(11., 19., dist) * (iR.w < 0. ? 1. - sqEase(uPart) : 1.);
        // squared, the dabs are counted, not scattered: one in fourteen stays, as a square 1.8 m on a side, the rest are
        // painted out as their bough clicks; none stays where it would stand in front of a plane of the composition
        float kept = step(fract(iR.y * 61.7), .072) * (1. - sgt);
        g *= mix(1., kept, m);
        vec3 b = iB + (bu * position.x + bv * position.y) * .9;
        vP = vec3(position.xy, m);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(c + (mix(a, b, m) - c) * g, 1.);
      }`,
    fragmentShader: /* glsl */`uniform vec3 uWhite, uWhiteB; varying vec3 vP;
      void main(){ vec2 q = abs(vP.xy); if (mix(length(q), max(q.x, q.y), vP.z) > 1.) discard; gl_FragColor = vec4(vP.z > .5 ? uWhiteB : uWhite, 1.); }` });
  const petalMesh = new THREE.Mesh(pg, petalMat); petalMesh.frustumCulled = false; group.add(petalMesh);
  await ctx.yield();

  // ---- panes: every run of a staircase carries rectangles in the gaps beside it; whites first, then the primaries.
  // Each pane stops short of its bars, sits on its own depth layer and is drawn out of one edge like a drawer.
  const panes = [], mix3 = rng.shuffle([0.13, 0.1, 0.07]), paints = [pal.red, pal.yellow, pal.blue];
  let nl = 0;
  for (const Lm of limbs) {
    if (Lm.trunk) continue;
    const C = [Lm.B[0]], CI = [0];
    for (let i = 1; i < Lm.m - 1; i++) { const a = Lm.B[i - 1], b = Lm.B[i], c = Lm.B[i + 1]; if (Math.abs((b[0] - a[0]) * (c[0] - b[0]) + (b[1] - a[1]) * (c[1] - b[1]) + (b[2] - a[2]) * (c[2] - b[2])) < 0.01) { C.push(b); CI.push(i); } }
    C.push(Lm.B[Lm.m - 1]); CI.push(Lm.m - 1);
    for (let j = 0; j + 1 < C.length; j++) {
      const P = C[j], Q = C[j + 1], N = C[j + 2] || C[j - 1], inset = Lm.wb * 0.5 + 0.8;
      const a = Math.abs(Q[0] - P[0]) > 0.01 ? 0 : (Math.abs(Q[1] - P[1]) > 0.01 ? 1 : 2), r = Math.abs(Q[a] - P[a]);
      const parts = r > 26 ? 3 : (r > 13 ? 2 : 1), others = [0, 1, 2].filter((k) => k !== a);
      for (let part = 0; part < parts; part++) {
        const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng(), r5 = rng(), r6 = rng(), lay = rng.int(1, 3) * (rng.chance(0.5) ? 0.4 : -0.4);
        // a pane stands only beside a run that is drawn as a bar (never alone in the air), and such runs carry more of them
        let drawn = true; for (let q = CI[j]; q < CI[j + 1]; q++) if (!Lm.vis[q]) drawn = false;
        if (!drawn || r5 > 0.5 || r < 5.9 || panes.length >= 2200) continue;
        // the pane lies in the plane of the stair where there is one (toward the next run), else in either
        let b = a !== 1 && r6 < 0.7 ? 1 : others[r6 * 9 % 1 < 0.5 ? 0 : 1], dir = r6 * 2 % 1 < 0.5 ? 1 : -1;
        if (N && r4 < 0.7) { const k = others.find((x) => Math.abs(N[x] - Q[x]) > 0.01 || Math.abs(N[x] - P[x]) > 0.01); if (k !== undefined) { b = k; dir = (N[k] - P[k] + N[k] - Q[k]) > 0 ? 1 : -1; } }
        const thin = 3 - a - b, depth = 6 * [1, 1, 2, 2, 3, 4][Math.floor(r1 * 6)] * (Lm.level === 0 ? 1.5 : 1);
        const m0 = Math.min(P[a], Q[a]), p = [0, 0, 0], s = [0, 0, 0];
        const lo = m0 + (r / parts) * part + (part === 0 ? inset : 0.6), hi = m0 + (r / parts) * (part + 1) - (part === parts - 1 ? inset : 0.6);
        s[a] = hi - lo; p[a] = (lo + hi) * 0.5;
        s[b] = depth - inset - 0.9; p[b] = P[b] + dir * (inset + s[b] * 0.5);
        s[thin] = 0.3; p[thin] = P[thin] + lay;
        if (s[a] < 2.6 || s[b] < 2.6 || p[1] - s[1] * 0.5 < 33 || p[1] + s[1] * 0.5 > TOP + 4) continue;
        if (inWedge(p) || inWedge(P) || inWedge(Q) || inKO(p) || inKO(P) || inKO(Q) || inSight(p) || inSight(P) || inSight(Q)) continue;                              // nothing stands between the lift and the trunk
        let ok = true; const pclr = Math.max(clear + 3, 1.8 * Math.max(s[a], s[b]));   // no pane fills the frame: the nearer, the smaller
        for (let u = -2; u <= 2 && ok; u++) for (let v = -2; v <= 2 && ok; v++) {
          const q = p.slice(); q[a] += u * s[a] * 0.25; q[b] += v * s[b] * 0.25;
          if (lineDist(q, corridor) < pclr) ok = false;
        }
        if (!ok) continue;
        let c = style.whites[Math.floor(r2 * 2.999)], late = r3 * 6; const pc = r2 * 7.31 % 1;
        if (pc < mix3[0] + mix3[1] + mix3[2]) { c = pc < mix3[0] ? paints[0] : (pc < mix3[0] + mix3[1] ? paints[1] : paints[2]); late = 8 + r3 * 24; }
        const long = s[a] >= s[b] ? a : b, slide = [0, 0, 0]; slide[long] = s[long] * (r3 * 5 % 1 < 0.5 ? 1 : -1);
        let drawer = r5 * 11 % 1 < 0.18;
        for (let u = -2; u <= 2 && drawer; u++) for (let v = -2; v <= 2 && drawer; v++) {
          const q = p.slice(); q[a] += u * s[a] * 0.25; q[b] += v * s[b] * 0.25; q[long] += slide[long] * 0.42;
          if (lineDist(q, corridor) < pclr) drawer = false;
        }
        panes.push({ p, s, c, slide, drawer, key: p[1] + s[1] * 0.5 + TILT * p[2] + LAG + late * (LAG / 27) });
      }
    }
    await ctx.yield();
  }
  await ctx.yield();
  const paneMesh = style.boxes(panes); group.add(paneMesh);
  await ctx.yield();

  // ---- gulls: two curved grey strokes meeting at a point, wheeling round the crown: the last curves in the world.
  // One that the front has passed becomes a black plus sign and from then on moves only in 3 m steps.
  const nGull = 30, NS = 6, gp = [], gs = [], gi = [], gg = [], gh = [];
  for (let st = 0; st < 2; st++) for (let k = 0; k < NS; k++) {
    const base = gp.length / 3, cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let e = 0; e < 2; e++) for (const c of cs) { gp.push(c[0] * 0.5, c[1] * 0.5, (k + e) / NS); gs.push(st); }
    for (const f of [[0, 1, 2, 0, 2, 3], [4, 6, 5, 4, 7, 6], [0, 4, 5, 0, 5, 1], [1, 5, 6, 1, 6, 2], [2, 6, 7, 2, 7, 3], [3, 7, 4, 3, 4, 0]]) for (const v of f) gi.push(base + v);
  }
  for (let i = 0; i < nGull; i++) {
    const low = rng.chance(0.45);
    gg.push(rng.range(70, 135), low ? rng.range(50, 92) : rng.range(120, 178), rng.range(0, 6.283), rng.range(9, 15) * (rng.chance(0.5) ? 1 : -1));
    gh.push(rng(), rng.range(3.2, 4.6));
  }
  // No gull wheels through the course. opts.flown is the line as flown, in the Tree's frame (the world samples it at every metre of the course: points a metre apart or nearer).
  // A gull whose whole orbit (the ellipse of its centre with its 7 m wave) comes nearer that line than 2.5 m and its reach is
  // raised or lowered by the least quarter metre that clears it (raised where both would). The reach is the farthest its skin stands from its centre: a wing
  // stroke's tip 1.16 spans off (5.34 m at most), a plus sign's bar end 2.73 m from a lattice point that is 2.6 m from the
  // centre at most (the heron's upright bar 7.05 m; the two lengths never point one way, so 5.35 and 9.65 m below are bounds
  // with room to spare). Nothing is dealt again; the angle, the speed and the radius stay.
  { const FLN = (opts.flown || []).filter((q) => Math.abs(q[0]) < 150 && Math.abs(q[2]) < 125), CLR = 2.5 + (opts.herons ? 9.65 : 5.35), C2 = CLR * CLR;
    let fx0 = 1e9, fx1 = -1e9; for (const q of FLN) { fx0 = Math.min(fx0, q[0] - CLR); fx1 = Math.max(fx1, q[0] + CLR); }
    // the line's points by squares of CLR in plan (the line is kept to 150 m east and west, 125 m north and south, above), two spare
    // squares round the edge; `near` marks a square with a point in it or in one of the eight round it. A place of an orbit asks
    // one flag, and only where it is set the nine squares: every point nearer than CLR in plan is in those.
    const GW = Math.ceil(300 / CLR) + 5, GH = Math.ceil(250 / CLR) + 5, cells = new Array(GW * GH), near = new Uint8Array(GW * GH), cix = (x) => Math.floor((x + 150) / CLR) + 2, ciz = (z) => Math.floor((z + 125) / CLR) + 2;
    for (const q of FLN) { const k = cix(q[0]) + ciz(q[2]) * GW; (cells[k] || (cells[k] = [])).push(q); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) near[k + dx + dz * GW] = 1; }
    for (let i = 0; i < nGull && FLN.length; i++) {
      const R = gg[i * 4], ph = gh[i * 2] * 6.283, pairs = [], da = 0.8 / R;
      for (let a = 0; a < 6.2832; a += da) { const ox = R * Math.cos(a); if (ox < fx0 || ox > fx1) continue; const oz = 0.82 * R * Math.sin(a), cx = cix(ox), cz = ciz(oz);
        if (cx < 0 || cx >= GW || cz < 0 || cz >= GH || !near[cx + cz * GW]) continue;
        const wy = 7 * Math.sin(a * 2 + ph);
        for (let ix = cx - 1; ix <= cx + 1; ix++) for (let iz = cz - 1; iz <= cz + 1; iz++) { const L = cells[ix + iz * GW]; if (!L) continue;
          for (const q of L) { const dx = ox - q[0], dz = oz - q[2], pd = dx * dx + dz * dz; if (pd < C2) pairs.push(wy - q[1], pd); } } }
      const clearAt = (y) => { for (let j = 0; j < pairs.length; j += 2) { const dy = y + pairs[j]; if (dy * dy + pairs[j + 1] < C2) return false; } return true; };
      if (!pairs.length || clearAt(gg[i * 4 + 1])) continue;
      for (let m = 0.25; m <= 80; m += 0.25) { if (clearAt(gg[i * 4 + 1] + m)) { gg[i * 4 + 1] += m; break; } if (clearAt(gg[i * 4 + 1] - m)) { gg[i * 4 + 1] -= m; break; } }
    } }
  const ug = new THREE.InstancedBufferGeometry(); ug.setIndex(gi);
  ug.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); ug.setAttribute('aStroke', new THREE.Float32BufferAttribute(gs, 1));
  ug.setAttribute('iG', IA(gg, 4)); ug.setAttribute('iH', IA(gh, 2)); ug.instanceCount = nGull;
  const gullMat = new THREE.ShaderMaterial({ uniforms: HU, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute float aStroke; attribute vec4 iG; attribute vec2 iH; varying vec3 vCol; uniform float uHeron; uniform vec3 uBird;
      ${GL}
      void main(){
        float a = iG.z + uTime * iG.w / iG.x, t = position.z, q = 1. - t, span = iH.y, sgn = aStroke < .5 ? -1. : 1.;
        vec3 c = vec3(iG.x * cos(a), iG.y + 7. * sin(a * 2. + iH.x * 6.283), iG.x * .82 * sin(a));
        vec3 fw = normalize(vec3(-sin(a), 0., .82 * cos(a)) * sign(iG.w)), rt = vec3(fw.z, 0., -fw.x), up = vec3(0., 1., 0.);
        float k = clamp((uFront - (c.y + uTilt * c.z)) / 4.5, 0., 1.), m = sqEase(k);
        float dist = distance((modelMatrix * vec4(c, 1.)).xyz, cameraPosition), w = max(.5, dist * .0026);
        float flap = sin(uTime * 2.2 + iH.x * 40.);
        vec3 wing = c + rt * sgn * span * q + up * span * ((.5 + .35 * flap) * q - .72 * q * q) + (fw * position.x + up * position.y) * w * (.35 + .65 * t);
        vec3 cs = floor(c / 3. + .5) * 3., ax = iH.x < .5 ? vec3(1., 0., 0.) : vec3(0., 0., 1.), bx = vec3(ax.z, 0., ax.x);
        vec3 plus = aStroke < .5 ? cs + ax * (t * 2. - 1.) * 2.7 * (1. - .8 * uHeron) + (bx * position.x + up * position.y) * max(.6, w)
                                 : cs + up * (t * 2. - 1.) * 2.7 * (1. + 1.6 * uHeron) + (ax * position.x + bx * position.y) * max(.6, w);
        vCol = k > .5 ? farInk(uBlack, dist) : uBird;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(wing, plus, m), 1.);
      }`,
    fragmentShader: 'varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }' });
  const gullMesh = new THREE.Mesh(ug, gullMat); gullMesh.frustumCulled = false; group.add(gullMesh);

  // ---- stand-alone backdrop (only when the world did not pass its own style): the white sky and the grey shore
  let skyMesh = null;
  if (opts.backdrop ?? !opts.style) {
    skyMesh = style.sky(); skyMesh.renderOrder = -0.5; group.add(skyMesh);
    const sea = new THREE.Mesh(new THREE.CircleGeometry(2600, 48), style.flat(pal.whiteWarm)); sea.rotation.x = -Math.PI / 2; sea.position.y = -8.2; group.add(sea);
    const dune = new THREE.Mesh(new THREE.PlaneGeometry(5200, 104), style.flat(pal.grey)); dune.rotation.x = -Math.PI / 2; dune.position.set(0, -0.1, 13); group.add(dune);
  }

  // ---- progress
  let driven = false, trunkK = 0, frontH = -1e4;
  const setTrunk = (k) => { driven = true; trunkK = Math.min(1, Math.max(0, k)); };
  const setFront = (h) => { driven = true; frontH = h; };
  const setFrontAt = (p) => setFront(p.y + TILT * p.z);   // p = the cage's position in the Tree's local space
  const setProgress = (u) => { driven = true; trunkK = Math.min(1, Math.max(0, u / 0.1)); frontH = u < 0.2 ? -1e4 : 30 + (u - 0.2) / 0.8 * 270; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z), last = corridor[corridor.length - 1], lev = corridor[Math.max(0, corridor.length - 2)];
  return {
    object: group, radius: 90, height: 186, center: V(0, 88, 0), ground: false, groundY: 0, style,
    setTrunk, setFront, setFrontAt, setProgress,
    stats: { segments: nSeg, petals: pk.length, panes: panes.length, mains: mains.length, branches: branches.length, twigs: twigs.length },
    anchors: {
      corridor: corridor.map((p) => V(p[0], p[1], p[2])), flyThrough: corridor.map((p) => V(p[0], p[1], p[2])), clearance: clear,
      fork: V(0, FORK, 0), trunkTop: V(0, 60, 0), crownTop: V(0, TOP, 0), wind: V(wind[0], 0, wind[1]),
      avenueStart: { position: V(lev[0], lev[1] - 6, lev[2] - 6), direction: V(last[0] - lev[0], 0, last[2] - lev[2]).normalize() },
      viewpoints: { sea: V(27, 5, 170), lift: V(27, 60, 32.4), levelOff: V(lev[0], lev[1], lev[2]) },
      lattice: { cell: 6, origin: V(0, 0, 0) }, frontTilt: TILT,
    },
    update(dt, time, camera) {
      if (!opts.style) style.update(dt, time, camera);
      if (!driven) {                                    // stand-alone: the whole change on a 30 s loop
        const t = time % 30, back = Math.min(1, Math.max(0, (t - 28) / 1.6));
        trunkK = Math.min(1, Math.max(0, (t - 2) / 0.35)) * (1 - back);
        frontH = t < 5 ? -1e4 : (30 + (t - 5) * 18) * (1 - back) - 80 * back;
      }
      U.uTrunk.value = trunkK; U.uFront.value = frontH;
      if (skyMesh && camera) skyMesh.follow(camera);
    },
    dispose() {},
  };
}
