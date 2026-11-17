// THE DOME OPENS: night in an 1890s observatory, 12 times life size for a moth-sized camera.
// The hero (src/parts/great-refractor.js) is the roof as a machine: turning dome, parting shutters, slewing telescope,
// rising floor. This file adds the building round it (brick drum, balcony on iron columns, shuttered windows, gallery,
// hoists, ruby sconces), the sky in the slit, the desk and its small life, rugs, chart table, globe and instruments on the deck, the
// moths, dust, lamp halos, and the flight: in level from under the north-east balcony with the desk's green pool ahead, over it, up to the
// driving clock in its ruby-lit case on the pier's west face, out to the west wall and round to the north-west while the starlight
// comes up on the whole machine (the set piece: the white tube aimed into the open slit, the sky whole beyond it), in over the
// counterweights and up the white flank to the brass cell against the stars, over the tube and down its east side to the tail and
// the desk, round behind the tail and up the inside of the tube, where the light builds from a cold haze at the tail through bays
// of blue and gold between black-backed baffles to the great lens full of stars.
// The sky in the slit is one chart laid out from the point the slit is set on, about the slit's own centre line: the Milky Way's spine
// comes in at the east edge and runs up and across it through the pointers, the Coalsack and the Cross; the Large Cloud alone in a
// clearing in the middle above the dew cap, the Small one lower left; a handful of brilliant stars over a dense field of faint ones.
// It swings slowly on two phases drawn from the seed. Round the upper tube, in the bar of starlight, motes glitter and seven pale
// hawk moths, a metre and a half across, climb one after another toward the slit.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/great-refractor.js';

const TAU = Math.PI * 2;
const DECK = '#74706e';      // the deck's boards: grey-brown, so the ruby and green pools carry the colour
const PALETTE = ['#0A1020', '#3A4B66', '#EEF2F6', '#A9C6F2', '#D8263A', '#3FBF7A', '#B08A4A'];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const bellU = (a, b, x) => { const t = (x - a) / (b - a); if (t <= 0 || t >= 1) return 0; const s = Math.sin(Math.PI * t); return s * s; };

// Four looks, all night and cold. Chosen by seed (ctx.vary.hour 'dawn' asks for the last one).
const LOOKS = [
  // summer, moonless: the Clouds high in the slit, ruby lanterns full up, a warm-dark hall
  { key: 'summer', star: '#A9C6F2', domeL: [0.17, 0.3], starHi: 2.2, starLo: 0.9, mw: 0.85, core: 0, lmc: 1, cloud: 0, dawn: 0, comet: 0, vap: 0, frost: 0, ruby: 1, rubyGain: 5.0, sconce: 2.6, deckKey: 0.36, domeK: 0.16,
    ambSky: [0.19, 0.235, 0.34], ambGnd: [0.07, 0.085, 0.13], amb: [0.3, 0.42, 1, 0.22], fill: 0.17, fog: '#0c162c', fogD: 0.0014, bg: '#050912', tint: '#f1f5ff', shadow: '#02040c', sat: 1.1, kitSky: '#6f84b4', kitGnd: '#303a58' },
  // winter: the heart of the Milky Way, frost on every rail and rivet, a paler, hazier hall
  { key: 'winter', star: '#c6d8fa', domeL: [0.1, 0.17], starHi: 2.3, starLo: 1.0, mw: 0.62, core: 0.75, lmc: 0.3, cloud: 0, dawn: 0, comet: 0, vap: 0.5, frost: 1.25, ruby: 0.9, rubyGain: 4.2, sconce: 2.0, deckKey: 0.44, domeK: 0.26,
    ambSky: [0.25, 0.305, 0.42], ambGnd: [0.1, 0.12, 0.17], amb: [0.42, 0.55, 1, 0.28], fill: 0.2, fog: '#16233e', fogD: 0.0021, bg: '#070c18', tint: '#e9f1ff', shadow: '#04070f', sat: 0.98, kitSky: '#8ea2c8', kitGnd: '#3f4a68' },
  // a crescent moon outside the slit and racing cloud: silver light that swells and fades, a silver patch travelling over the deck
  { key: 'moon', star: '#dde2ec', domeL: [0.17, 0.32], dome: '#bccbe8', starHi: 2.35, starLo: 1.05, mw: 0.6, core: 0, lmc: 0.7, cloud: 1, dawn: 0, comet: 0, vap: 0, frost: 0, ruby: 1, rubyGain: 5.2, sconce: 2.9, deckKey: 0.9, domeK: 0.2,
    ambSky: [0.2, 0.232, 0.315], ambGnd: [0.074, 0.084, 0.118], amb: [0.3, 0.41, 0.96, 0.22], fill: 0.17, fog: '#10182c', fogD: 0.0015, bg: '#060a13', tint: '#f5f6ff', shadow: '#03040d', sat: 1.08, kitSky: '#8792b2', kitGnd: '#383f56' },
  // the last hour before dawn: lanterns turned down a little, a teal key from the slit over a blue-grey dome, ruby and green pools still on the deck, a comet low in the slit
  { key: 'dawn', star: '#8fd0dc', domeL: [0.15, 0.26], starHi: 2.1, starLo: 0.95, mw: 0.35, core: 0, lmc: 0.55, cloud: 0, dawn: 1, comet: 1, vap: 0, frost: 0, ruby: 0.72, rubyGain: 4.8, sconce: 3.3, deckKey: 0.3, dome: '#8fb4e6', domeK: 0.42,
    ambSky: [0.115, 0.225, 0.305], ambGnd: [0.044, 0.09, 0.125], amb: [0.17, 0.3, 1, 0.16], fill: 0.2, fog: '#0b1f2b', fogD: 0.0016, bg: '#031110', tint: '#e8f8f8', shadow: '#020f12', sat: 1.12, kitSky: '#58a59e', kitGnd: '#244a48' },
];

// ------------------------------------------------------------------ the sky in the slit (one strip of far-plane sky)
const SKY_VERT = /* glsl */`
varying vec3 vW; varying vec3 vL;
void main(){ vL = position; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const SKY_FRAG = /* glsl */`
uniform mat3 uRot; uniform float uTime; uniform vec4 uLook; uniform vec4 uLook2; uniform vec3 uMetA; uniform vec3 uMetB; uniform vec4 uMet; uniform vec3 uMoon; uniform vec2 uMet2; uniform vec2 uSwing;
varying vec3 vW; varying vec3 vL;
// The sky's own chart. LMC is the point of the sky the slit is set on (the world turns the sky so that it stands in the opening);
// everything else is laid out from it in two directions: across the slit (west positive) and up it (toward the crown).
const vec3 LMC = vec3(0.213, 0.793, 0.570); const vec3 MWP = vec3(0.963, -0.114, -0.245);
const vec3 COMET = vec3(0.30, 0.53, 0.79); const vec3 CT = vec3(-0.12, 0.66, -0.74);
// every charted thing (all that is drawn with AT) stands this far up the slit from where it was drawn; the Milky Way's spine keeps its own line (see the note above the swing)
const float LIFT = 0.040;
#define AT(a, b) normalize(A0 + Bv * (a) + T * ((b) + LIFT))
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z); }
float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
// one layer of stars. ex steepens the spread of brightness: a few brilliant, many faint; the brightest carry a soft glow
vec3 starField(vec3 d, float sc, float pix, float seed, float boost, float spread, float ex){
  vec3 g = d * sc; vec3 id = floor(g); vec3 f = g - id - 0.5;
  float h = clamp(h31(id + seed), 0.0, 1.0);
  vec3 o = (vec3(h31(id + seed + 11.3), h31(id + seed + 23.7), h31(id + seed + 37.1)) - 0.5) * spread;
  float m = pow(h, ex);
  float r0 = 0.035 + 0.09 * m; float r = max(r0, 1.2 * pix * sc);
  float dd = length(f - o); float k = r0 / r;
  float tw = 1.0 - (0.16 + 0.3 * m) * (0.5 + 0.5 * sin(uTime * (2.0 + 5.0 * h) + h * 90.0));
  float hc = h31(id + seed + 5.0);
  vec3 tint = mix(vec3(0.62, 0.78, 1.0), vec3(0.92, 0.96, 1.0), step(0.5, hc)); tint = mix(tint, vec3(1.0, 0.76, 0.52), step(0.93, hc));
  float core = 1.0 - smoothstep(0.0, r, dd);
  return tint * (boost * tw * m * (core * core * k * k + 0.12 * m * exp(-dd * dd * 60.0)));
}
// one of the sky's few brilliant stars: a hard point, a soft glow round it, a slow twinkle
vec3 bstar(vec3 s, vec3 F, float mag, vec3 tint, float pix, float ph){
  float dd = length(s - F); float r = max(0.0016, 1.3 * pix); float k = 0.0016 / r;
  float tw = 0.8 + 0.2 * sin(uTime * (2.3 + ph) + ph * 40.0) * sin(uTime * 0.9 + ph * 17.0);
  return tint * (mag * tw * (9.0 * exp(-dd * dd / (r * r)) * max(k * k, 0.4) + 0.24 * exp(-dd / 0.0045) + 0.03 * exp(-dd / 0.02)));
}
void main(){
  vec3 d = normalize(vW - cameraPosition);
  float pix = length(fwidth(d));
  vec3 s0 = uRot * d;
  vec3 A0 = normalize(LMC); vec3 T = normalize(cross(A0, MWP)); vec3 Bv = cross(A0, T);
  // The sky turns: a slow swing about the point the slit is set on, 0.018 rad across the slit and 0.014 rad along it, each on a phase
  // of its own drawn from the world's seed (no clock is special); a third of a degree a second where both are at their quickest.
  // The chart is one constant, pinned to the slit, the same at every hour. What the eye is meant to find in it (the Cross and its two
  // pointers, the Coalsack, the Large Cloud) is drawn, in the chart's own measure across the slit, from 0.176 east of the pinned point
  // (the Coalsack's rim) to 0.041 west of it (the Large Cloud's rim). The rule for its place: it stands centred in the cut of the
  // dome's skin as the approach has it. LIFT moves every charted thing (all that is drawn with AT) up the slit together. It was
  // set, when the cut was 80 m wide, to the thousandth of a radian at which the group's least margin to the east edge of the cut
  // and its least margin to the west edge were nearest to equal, from eyes two metres apart along the route between 310 m (where
  // the shutters stand open) and 642 m (past the lens cell), at every stand of the swing, with the dome's whole creep (2.5 degrees
  // either way) and the pin's whole wobble (0.012 rad). The cut now stands 112 m wide and the lift is kept: measured the same way,
  // the least margin to the east edge is 0.0792 rad (the Coalsack's rim, 364 m along the route) and to the west edge 0.0796 rad
  // (the Large Cloud's rim, 342 m along it); the lift at which the two are nearest to equal is now 0.041, a thousandth further.
  // The least clear sky between the group and the telescope is 0.71 m, between the Large Cloud's rim and the lens cell with its
  // bolt heads, 542 m along the route. What the rule does not cover, as facts: the edges are those of the cut in the skin (112 m
  // wide at radius 160); the west curb hangs 4.2 m inside the skin and, from the west wall, stands before that edge (at the 80 m
  // cut the least sky west of the Large Cloud's rim was 0.0166 rad there; not measured again); the Milky Way's spine keeps its own
  // line, so the group stands a hundredth of a radian further in on the band's shoulder than it was drawn; the Carina knot at the
  // top of the chart is not of the group and goes up to 0.03 rad behind the head of the opening at the far stands of the swing,
  // about 364 m along the route; and past 642 m, down the east flank of the room, the east edge of the cut may cross the group (at
  // the 80 m cut it did from 672 m to 890 m; not measured again). The figure belongs to this route and pin.
  vec3 wv = T * (0.018 * sin(uTime * 0.25 + uSwing.x)) - Bv * (0.014 * sin(uTime * 0.17 + uSwing.y));
  vec3 s = normalize(s0 + cross(wv, s0));
  // ---- the Milky Way: a spine of star clouds running up the slit along its east side, the pointers, the Coalsack and the Cross on
  // its inner shoulder, split by a long dark lane, ragged with dust
  float coreL = uLook2.w;
  vec3 Fl = AT(-0.01, 0.31); vec3 dl = s - Fl; vec2 lp = vec2(dot(dl, Bv), dot(dl, T));
  float lr2 = dot(lp, lp); float lk = 0.45 + 0.55 * uLook.y;      // (the Clouds hold in every look: fainter on a winter or a dawn sky, never gone)
  float clr = 1.0 - 0.95 * lk * exp(-lr2 / 0.0075);      // the Large Cloud stands in a clearing: dark sky on every side of it
  vec3 P = Bv * 0.969 + T * 0.247;
  float n1 = fbm(s * 3.2 + 2.0), n2 = fbm(s * 8.5 + vec3(5.0, 1.0, 3.0)), n3 = fbm(s * 23.0 + vec3(9.0, 4.0, 7.0));
  float b = dot(s, P) + 0.0735 - 0.09 * coreL;
  float bw = b + 0.05 * (n1 - 0.5);
  float spine = exp(-bw * bw * (300.0 - 320.0 * coreL)), halo = exp(-b * b * 14.0);
  vec3 Fc = AT(-0.142, 0.383); float dc = length(s - Fc);           // the Coalsack: a hole in the spine, the Cross beside it
  float knots = n2 * n2 * (0.5 + 1.6 * n3) + 0.3 * exp(-dc * dc / 0.004);      // (the star clouds crowd brightest round the Coalsack, so the hole reads)
  float rift = mix(smoothstep(0.006, 0.03, abs(bw + 0.02 + 0.07 * (n2 - 0.47))), 1.0, exp(-dc * dc / 0.004));
  float dustN = fbm(s * 12.0 + vec3(2.0, 7.0, 1.0));
  float dust = smoothstep(0.36, 0.6, dustN + abs(bw) * 2.2 + 0.3 * exp(-dc * dc / 0.004));
  float coal = 1.0 - smoothstep(0.013, 0.034, dc + 0.034 * (n3 - 0.5) + 0.024 * (n2 - 0.47));      // ragged, soft at the rim
  float lanes = mix(0.07, 1.0, rift) * mix(0.16, 1.0, dust) * (1.0 - 0.97 * coal);
  vec3 Fh = AT(-0.02, 0.04);
  float coreK = exp(-(1.0 - dot(s, Fh)) * 9.0) * coreL;            // winter: the bright heart of it fills the slit
  float mwv = (spine * (0.24 + 3.2 * knots) + halo * (0.32 - 0.27 * coreL) * (0.4 + n1)) * lanes * (1.0 + 2.2 * coreK) * clr;
  vec3 col = vec3(0.006, 0.011, 0.029);
  vec3 mwc = mix(vec3(0.46, 0.66, 1.0), vec3(0.9, 0.95, 1.0), smoothstep(0.2, 0.8, knots));      // pale blue haze, cold white where the star clouds crowd
  mwc = mix(mwc, vec3(1.0, 0.9, 0.74), 0.4 * coreK);
  col += mwc * (0.4 * (uLook.x + 0.5 * (1.0 - uLook.x) * exp(-dc * dc / 0.006)) * mwv);      // (round the Coalsack the star clouds keep half their light on the faintest night, so the hole reads)
  // nebulae strung along the band: rose knots, a teal veil beside them
  float nb = smoothstep(0.5, 0.78, fbm(s * 11.0 + vec3(9.0, 3.0, 1.0))) * smoothstep(0.25, 0.9, halo) * (0.25 + 2.6 * n1 * n1) * (0.6 + 0.8 * vn(s * 47.0));
  float nt = smoothstep(0.5, 0.82, fbm(s * 7.0 + vec3(1.0, 17.0, 5.0))) * smoothstep(0.06, 0.6, halo) * (1.0 - nb);
  col += (vec3(1.0, 0.2, 0.42) * (nb * 0.32) + vec3(0.08, 0.72, 0.66) * (nt * 0.15)) * (0.4 + 0.6 * uLook.x) * (1.0 - 0.9 * coal) * clr;
  // the colour this sky had before the chart was drawn, in the same sky coordinates, so it stands where it stood in the slit (it
  // swings with the chart): along the earlier band that sky's rose knots and teal veil by its own lines, its blue haze round them
  // only, and its gold dust as a turning of the light and not as light added.
  // As 12c's own rose knots and teal veil it is thinned in the Coalsack and in the clearing round the Large Cloud, so the chart reads
  // as it does; the earlier sky's own Coalsack hole and its winter heart are not brought back (one sky, one Coalsack, one heart).
  float b0 = dot(s, MWP) + 0.05; float band0 = exp(-b0 * b0 * 15.0);
  float cl0 = fbm(s * 5.0 + 2.0); float lane0 = smoothstep(0.34, 0.6, fbm(s * 9.0 + vec3(5.0, 1.0, 3.0)) + abs(b0) * 0.9);
  float gd0 = fbm(s * 3.1 + vec3(1.7, 9.2, 4.4));
  float kn0 = smoothstep(0.5, 0.78, fbm(s * 11.0 + vec3(9.0, 3.0, 1.0))) * smoothstep(0.25, 0.9, band0);      // where a rose knot stands
  float kt0 = smoothstep(0.5, 0.82, fbm(s * 7.0 + vec3(1.0, 17.0, 5.0))) * smoothstep(0.06, 0.6, band0);      // where the teal veil lies
  float nb0 = kn0 * (0.25 + 2.6 * cl0 * cl0) * (0.6 + 0.8 * vn(s * 47.0));
  float nt0 = kt0 * (1.0 - nb0);
  // the blue haze stands at its strength where the knots and the veil are (full where either is a quarter grown) and is nothing
  // away from them: there the night is the chart's own. The gold dust adds no light of its own: where it lies (at most 85 parts in
  // 100) it turns the light gathered so far to gold at about the brightness it had (1.08 times), as dust colours what shines
  // through it, and the blue haze is kept out of it; the rose knots and the teal veil are laid after it in their own colours
  float gk0 = smoothstep(0.46, 0.68, gd0) * smoothstep(0.1, 0.7, band0);
  float th0 = (1.0 - 0.9 * coal) * clr;
  col += vec3(0.4, 0.58, 1.0) * ((1.0 - gk0) * smoothstep(0.0, 0.25, max(kn0, kt0)) * 0.26 * uLook.x * band0 * (0.22 + 1.7 * cl0 * cl0) * mix(0.12, 1.0, lane0) * th0);
  col = mix(col, vec3(1.0, 0.66, 0.26) * (dot(col, vec3(0.3, 0.59, 0.11)) * 1.5), 0.85 * gk0 * th0 * (0.4 + 0.6 * uLook.x));
  col += (vec3(1.0, 0.2, 0.42) * (nb0 * 0.32) + vec3(0.08, 0.72, 0.66) * (nt0 * 0.15)) * ((0.4 + 0.6 * uLook.x) * th0);
  vec3 Fe = AT(-0.185, 0.54); float de = length(s - Fe);      // the great nebula in Carina, further up the spine
  col += (vec3(1.0, 0.5, 0.62) * exp(-de * de / 0.0005) * (0.3 + 0.9 * n3) + vec3(1.0, 0.9, 0.95) * exp(-de * de / 0.00005)) * (0.5 * uLook.x);
  // ---- the Magellanic Clouds. The Large one in the middle of the slit: a detached pale cloud a fist wide, a brighter bar across it,
  // one rose knot and two star knots; the Small one lower left, a third its size
  float lm = fbm(s * 30.0 + 3.0);
  float lq = max(lr2 * (1.0 + 0.9 * (n3 - 0.5) + 0.7 * (n2 - 0.47)), 0.0) / 0.0026; float lbody = exp(-lq * sqrt(lq));      // full to the shoulder, then a quick fall to dark
  vec2 bp = vec2(0.82 * lp.x + 0.57 * lp.y, -0.57 * lp.x + 0.82 * lp.y);
  float lbar = exp(-(bp.x * bp.x / 0.0011 + bp.y * bp.y / 0.00009));
  vec2 kp = lp - vec2(0.027, 0.03), kp2 = lp + vec2(0.02, 0.008), kp3 = lp - vec2(-0.008, 0.026);
  float lknot = exp(-dot(kp, kp) / 0.00004), lk2 = exp(-dot(kp2, kp2) / 0.00002) + 0.7 * exp(-dot(kp3, kp3) / 0.000015);
  vec3 Fs = AT(-0.05, 0.195); vec3 dsv = s - Fs; vec2 sp2 = vec2(dot(dsv, Bv), dot(dsv, T));
  float l2 = exp(-(sp2.x * sp2.x / 0.00028 + sp2.y * sp2.y / 0.00048) * (1.0 + 0.8 * (n3 - 0.5)));
  vec3 mag = vec3(0.62, 0.78, 1.0) * (lk * (lbody * (0.34 + 0.56 * lm + 0.26 * smoothstep(0.5, 0.75, lm)) + lbar * (0.2 + 0.3 * lm) + 0.5 * lk2 + l2 * (0.24 + 0.46 * lm)))
    + vec3(1.0, 0.7, 0.86) * (lk * 0.6 * lknot);
  // ---- stars. Under everything a dense field of faint cold ones; over it three sizes, crowded along the spine and in the Clouds and
  // thinned by the dust; then the few brilliant ones, each charted by hand
  float dens = 1.0 + (3.0 * spine * lanes + 0.6 * halo) * uLook.x * (1.0 + coreK) * clr + 2.2 * lbody * lk + 1.5 * l2 * lk;
  vec3 st = starField(s, 20.0, pix, 80.0, 14.0, 0.7, 10.0) + starField(s, 44.0, pix, 0.0, 10.0 * dens, 0.6, 4.5) + starField(s, 90.0, pix, 40.0, 4.5 * dens, 0.4, 2.5);
  st += (starField(s, 61.0, pix, 120.0, 24.0, 0.6, 3.0) + starField(s, 127.0, pix, 160.0, 19.0, 0.5, 3.0)) * (0.85 + 0.3 * dens) * (0.5 + 0.5 * clr) * (1.0 - 0.5 * coreL);
  st *= (1.0 - 0.8 * coal) * (1.0 - 0.8 * lk * exp(-lr2 / 0.0075) * (1.0 - lbody));      // few stars in the Coalsack, and in the moat of dark sky round the Large Cloud
  vec3 cb = vec3(0.66, 0.82, 1.0), cw = vec3(0.95, 0.97, 1.0), co = vec3(1.0, 0.72, 0.46);
  // the Cross (foot, east arm, head, west arm) and the two pointers below it along the spine
  st += bstar(s, AT(-0.108, 0.388), 2.2, cb, pix, 0.3) + bstar(s, AT(-0.130, 0.420), 1.8, cb, pix, 1.1)
      + bstar(s, AT(-0.106, 0.448), 1.5, co, pix, 1.9) + bstar(s, AT(-0.087, 0.415), 1.1, cb, pix, 2.6)
      + bstar(s, AT(-0.133, 0.314), 2.4, cw, pix, 3.4) + bstar(s, AT(-0.128, 0.342), 1.8, cb, pix, 4.2)
      + bstar(s, AT(0.040, 0.130), 2.5, cw, pix, 5.1) + bstar(s, AT(-0.030, 0.520), 1.5, cb, pix, 5.9)
      + bstar(s, AT(-0.110, 0.200), 1.4, co, pix, 6.7);
  // the hour before dawn: teal at the foot, and a comet standing with its tail upward
  float el = smoothstep(0.2, 0.85, d.y);
  col = mix(col, mix(vec3(0.014, 0.085, 0.1), vec3(0.006, 0.022, 0.065), el) + col * 0.6, uLook.w);
  st *= mix(1.0, mix(0.15, 0.9, el), uLook.w);
  col += mag;
  vec3 cv = s - normalize(COMET); vec3 ct3 = normalize(CT); float ct = dot(cv, ct3); float cs = length(cv - ct3 * ct);
  float cw2 = 0.006 + 0.13 * max(ct, 0.0);
  float tail = exp(-cs * cs / (cw2 * cw2)) * exp(-max(ct, 0.0) * 6.0) * smoothstep(0.0, 0.015, ct);
  col += vec3(0.6, 0.92, 1.0) * (uLook2.x * (exp(-dot(cv, cv) * 30000.0) * 5.0 + exp(-dot(cv, cv) * 1800.0) * 0.5 + tail * 0.55));
  col += st;
  // racing cloud under a moon that stands just outside the slit: dark rags that blot the stars out, silver only on the edge that faces the moon
  vec3 cq = d * vec3(4.4, 2.6, 4.4) + vec3(uTime * 0.15, uTime * 0.03, uTime * 0.07);
  float cbase = fbm(cq);
  float cn = cbase + 0.2 * (vn(cq * 5.3) - 0.5) + 0.13 * (vn(cq * 13.0) - 0.5) + 0.09 * (vn(cq * 31.0) - 0.5) + 0.05 * (vn(cq * 67.0) - 0.5);
  vec3 cq2 = cq + uMoon * 0.05; float cm = fbm(cq2) + 0.2 * (vn(cq2 * 5.3) - 0.5) + 0.12 * (vn(cq2 * 13.0) - 0.5);      // the same cloud a little way toward the moon
  float gap = 0.12 + 0.88 * smoothstep(0.13, 0.22, length(s - AT(-0.07, 0.37)));      // the rags thin to a veil where the Cross, the Coalsack and the Large Cloud stand: a part of the sky chart, the same at every hour
  float cc = smoothstep(0.515, 0.615, cn); cc = cc * cc * (3.0 - 2.0 * cc) * uLook.z * gap;      // soft-edged rags: thin veils at the rim, stars dim through them, most of the sky open
  float lit = clamp((cn - cm) * 13.0, 0.0, 1.0);                                  // thinning toward the moon: a lit edge
  float edge = smoothstep(0.518, 0.536, cn) * (1.0 - smoothstep(0.542, 0.572, cn)) * lit * uLook.z * gap * smoothstep(0.5, 0.56, cbase);      // a thin silver line on the side that faces the moon, only where a rag really ends (no marks on stray wisps in open sky)
  float mg = exp(-(1.0 - dot(d, uMoon)) * 5.0);
  vec3 body = mix(vec3(0.034, 0.042, 0.064), vec3(0.007, 0.009, 0.016), smoothstep(0.56, 0.7, cn)) + vec3(0.3, 0.36, 0.5) * (0.07 * lit * (1.0 - smoothstep(0.55, 0.68, cn)));
  col = mix(col, body, cc * 0.96);      // grey veils against the bright sky, dark at their hearts
  col += vec3(0.62, 0.72, 0.92) * (edge * (0.24 + 0.5 * mg));
  col += vec3(0.5, 0.62, 0.85) * (uLook.z * 0.05 * mg);
  // winter: vapour curling in at the foot of the slit
  float vf = (1.0 - smoothstep(0.0, 75.0, vL.y)) * smoothstep(0.3, 0.75, fbm(vec3(vL.x * 0.07, vL.y * 0.05 - uTime * 0.25, uTime * 0.07)));
  col += vec3(0.07, 0.095, 0.15) * (uLook2.y * vf);
  // meteor / fireball: a streak between two directions
  vec3 ab = uMetB - uMetA; float hh = clamp(dot(d - uMetA, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  float md = length(d - normalize(uMetA + ab * hh)); float mw = max(0.0035, 1.2 * pix) * uMet.a;      // the ends are far apart on the sky: measure to the arc, not the chord
  vec3 dh = d - uMetB;
  float trail = exp(-md * md / (mw * mw)) * hh * hh + uMet2.y * exp(-md * md / (mw * mw * 12.0)) * hh * hh * hh;
  col += uMet.rgb * (trail + uMet2.x * exp(-dot(dh, dh) / (mw * mw * 3.0)) + uMet2.y * 0.5 * exp(-dot(dh, dh) / (mw * mw * 40.0)));
  gl_FragColor = vec4(col * uLook2.z, 1.0);
}`;

// ------------------------------------------------------------------ moths (instanced; wings beat in the vertex shader; lit by the hero's rig)
const MOTH_VERT = /* glsl */`
attribute vec3 aW; attribute float aPh; attribute float aTone;
uniform float uTime; uniform float uFlap;
varying vec2 vUv; varying vec3 vWp; varying float vPart; varying float vShade; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float fl = sin(uTime * uFlap + aPh * 6.2832);
  float lag = sin(uTime * uFlap + aPh * 6.2832 - 0.9 * aW.y);
  float ang = (0.2 + 0.66 * mix(fl, lag, aW.y)) * aW.x * step(0.5, aW.z) * (1.0 - 0.25 * step(1.5, aW.z));
  float c = cos(ang), s = sin(ang); p.xy = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  p.y += 0.06 * fl * (1.0 - step(0.5, aW.z));
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vUv = uv; vWp = wp.xyz; vPart = aW.z; vSeed = aPh; vShade = aTone * (1.0 - 0.3 * step(0.5, aW.z) * (0.5 - 0.5 * fl));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const mothFrag = (LIGHT) => /* glsl */`
uniform vec3 uColA; uniform vec3 uColB; uniform vec3 uColC; uniform float uPlume;
varying vec2 vUv; varying vec3 vWp; varying float vPart; varying float vShade; varying float vSeed;
#include <fog_pars_fragment>
${LIGHT}
void main(){
  float wing = step(0.5, vPart), hind = step(1.5, vPart);
  float n = vnoise(vec3(vUv * 9.0, vSeed * 13.0)), n2 = vnoise(vec3(vUv * 31.0, vSeed * 7.0));
  // forewing: a mottled buff ground, three wavy cross bars, a pale spot ringed dark, a dark margin with a pale fringe
  float wav = vUv.x + 0.05 * sin(vUv.y * 11.0 + vSeed * 6.0) + 0.03 * (n - 0.5);
  float bars = (1.0 - smoothstep(0.0, 0.04, abs(wav - 0.3))) + 0.8 * (1.0 - smoothstep(0.0, 0.05, abs(wav - 0.53))) + 0.9 * (1.0 - smoothstep(0.0, 0.035, abs(wav - 0.72)));
  float margin = smoothstep(0.86, 0.97, vUv.x);
  vec2 sd = (vUv - vec2(0.46, 0.66)) * vec2(1.0, 0.6); float sr = length(sd);
  vec3 fore = mix(uColA, uColB, clamp(0.55 * bars + 0.3 * (n - 0.35) + 0.75 * margin, 0.0, 1.0));
  fore = mix(fore, uColB * 0.5, (1.0 - smoothstep(0.055, 0.075, sr)) * 0.9); fore = mix(fore, uColA * 1.25, 1.0 - smoothstep(0.025, 0.04, sr));
  fore = mix(fore, uColA * 1.1, smoothstep(0.985, 1.0, vUv.x) * 0.6);
  // hindwing: a rose flush near the body, an eye of dark and pale blue, a dark band along the edge
  vec2 ed = (vUv - vec2(0.5, 0.02)) * vec2(1.0, 0.75); float er = length(ed);
  vec3 hw = mix(uColC, uColA * 0.8, smoothstep(0.25, 0.8, vUv.x));
  hw = mix(hw, uColB * 0.45, (1.0 - smoothstep(0.14, 0.17, er)) * smoothstep(0.06, 0.09, er));
  hw = mix(hw, vec3(0.42, 0.56, 0.8), 1.0 - smoothstep(0.05, 0.075, er));
  hw = mix(hw, uColB * 0.6, smoothstep(0.74, 0.9, vUv.x + 0.25 * (0.3 - vUv.y)));
  vec3 alb = mix(fore, hw, hind);
  // the pale cast (ghost moths): the same bars and eyes, half washed out under fine ribs
  alb = mix(alb, mix(uColA * 1.05, uColB, 0.3 * margin + 0.22 * step(0.5, fract(vUv.y * 9.0 + vUv.x * 3.0))), uPlume * 0.45);
  alb *= 0.86 + 0.28 * n2;
  // body: pale fur on the thorax, a banded abdomen, lighter along the back
  float seg = smoothstep(0.3, 0.7, 0.5 + 0.5 * sin(vUv.x * 44.0));
  vec3 body = mix(uColA * 1.05, mix(uColB * 0.8, uColC * 1.1, seg), smoothstep(0.42, 0.56, vUv.x));
  body *= (0.62 + 0.5 * sin(vUv.y * 3.1416)) * (0.8 + 0.4 * n2) * 0.55;
  alb = mix(alb, alb * alb * 3.2, 0.6);      // deeper bars, paler ground
  alb *= 1.0 + 0.5 * smoothstep(0.9, 1.0, vUv.x) * (1.0 - hind);      // the pale fringe catches the light
  alb = mix(body, alb, wing);
  // light: the room's cold ambient, every lamp in reach, the bar of starlight, and inside the tube the colours of the lens
  vec3 lit = mix(uAmbGnd, uAmbSky, 0.65) * 1.15;
  for (int i = 0; i < 8; i++) {
    vec3 d = uLampPos[i].xyz - vWp; float r2 = dot(d, d); float rr = uLampPos[i].w;
    float att = max(1.0 - r2 / max(rr * rr, 1.0), 0.0); att = att * att / (1.0 + r2 * 10.8 / max(rr * rr, 1.0));
    vec3 lc = uLampCol[i]; lc = mix(lc, vec3(dot(lc, vec3(0.3, 0.55, 0.15))) * vec3(1.0, 0.95, 0.82), 0.8);      // pale wings take a lamp's tint, not its whole colour
    lit += lc * (att * 0.4);
  }
  {
    float sg = 6.2832 / max(uRing.w, 1.0); float la = floor(atan(vWp.x, vWp.z + (abs(vWp.z) < 1e-4 ? 2e-4 : 0.0)) / sg + 0.5) * sg;
    vec3 d = vec3(sin(la) * uRing.x, uRing.y, cos(la) * uRing.x) - vWp; float r2 = dot(d, d);
    float att = max(1.0 - r2 / max(uRing.z * uRing.z, 1.0), 0.0); lit += uRingCol * (att * att / (1.0 + r2 * 0.0065) * 0.45);
  }
  lit += uStarCol * (uStar * 0.26 * slitMask(vWp) * tubeShadow(vWp));
  vec3 pa = vWp - uCtr; float sx = dot(pa, uKeyDir); float inT = step(dot(pa, pa) - sx * sx, 110.0) * step(-91.0, sx) * step(sx, 113.0);
  lit += tubeRings(sx, vSeed * 6.0) * (inT * uTube.x * (0.22 + 0.8 * smoothstep(-100.0, 112.0, sx)));
  float pale = step(1.6, vShade);      // (the moths that climb the bar of starlight: pale wings that hold the light)
  lit += uStarCol * (uStar * 0.2 * pale * slitMask(vWp));
  vec3 col = max(alb * lit * vShade, vec3(0.0)); col = col / (1.0 + (0.9 - 0.45 * pale) * dot(col, vec3(0.3, 0.55, 0.15)));      // tinted by whatever lights them, never white
  col = mix(col, uFlash.rgb * (dot(col, vec3(0.3, 0.55, 0.15)) * 1.7), uFlash.a);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ paper on the desk: charts, logbook, chronometer dial
const PAPER_VERT = /* glsl */`
attribute vec2 aK;
uniform float uTime;
varying vec2 vUv; varying vec3 vWp; varying float vKind; varying float vLift;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float l = aK.y * aK.y;
  float gust = 0.5 + 0.5 * sin(uTime * 0.9 + aK.x * 2.3) + 0.25 * sin(uTime * 2.7 + aK.x * 5.0 + position.x * 0.4);
  p.y += l * (0.25 + 1.3 * max(gust, 0.0));
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vUv = uv; vWp = wp.xyz; vKind = aK.x; vLift = l * gust;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PAPER_FRAG = /* glsl */`
uniform vec4 uLamp; uniform vec3 uLampCol; uniform vec3 uAmb; uniform float uHand;
varying vec2 vUv; varying vec3 vWp; varying float vKind; varying float vLift;
#include <fog_pars_fragment>
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float ln(float d, float w, float aa){ return 1.0 - smoothstep(w, w + aa, abs(d)); }
void main(){
  vec2 uv = vUv; float aa = max(fwidth(uv.x), fwidth(uv.y)) * 1.5;
  vec3 paper = vec3(0.74, 0.76, 0.74); vec3 ink = vec3(0.04, 0.06, 0.12); float k = 0.0; float gl = 0.0;
  if (vKind < 1.5) {
    // star charts: 0 a polar chart (rings and hour lines), 1 a ruled zone chart; both sown with ink stars
    vec2 c = uv - 0.5; float r = length(c);
    if (vKind < 0.5) {
      float rr = r * 10.0; k = max(k, ln(fract(rr + 0.5) - 0.5, 0.012, aa * 10.0) * step(r, 0.455) * 0.55);
      float a = atan(c.y, c.x + (abs(c.x) < 1e-5 ? 1e-4 : 0.0)) / 6.2832 * 24.0; k = max(k, ln(fract(a + 0.5) - 0.5, 0.004 / max(r, 0.03), aa * 4.0 / max(r, 0.03)) * step(r, 0.455) * step(0.05, r) * 0.45);
      k = max(k, ln(r - 0.455, 0.004, aa)); k = max(k, ln(r - 0.47, 0.0015, aa) * 0.8);
    } else {
      vec2 g = uv * vec2(12.0, 9.0); k = max(k, max(ln(fract(g.x + 0.5) - 0.5, 0.012, aa * 12.0), ln(fract(g.y + 0.5) - 0.5, 0.012, aa * 9.0)) * 0.45);
      k *= step(0.04, uv.x) * step(uv.x, 0.96) * step(0.05, uv.y) * step(uv.y, 0.95);
      k = max(k, ln(max(abs(c.x) - 0.46, abs(c.y) - 0.45), 0.003, aa));
    }
    vec2 sg = uv * 34.0; vec2 si = floor(sg); vec2 sf = fract(sg) - 0.5; float sh = h21(si + vKind * 17.0);
    vec2 so = (vec2(h21(si + 3.1), h21(si + 7.7)) - 0.5) * 0.6;
    float sr = 0.05 + 0.3 * sh * sh * sh; float star = (1.0 - smoothstep(sr, sr + aa * 34.0, length(sf - so))) * step(0.62, sh) * step(r, 0.445 + vKind);
    k = max(k, star);
    k = mix(0.1, k, 1.0 - smoothstep(0.012, 0.045, aa));      // far off the rulings and ink stars melt into one tone
    paper *= 0.94 + 0.06 * h21(floor(uv * 3.0));
  } else if (vKind < 2.5) {
    // the logbook: ruled lines, a margin, and rows of dots and dashes where the night has been written down
    float page = step(0.5, uv.x); vec2 q = vec2(fract(uv.x * 2.0), uv.y);
    float li = floor(q.y * 22.0); float lf = fract(q.y * 22.0);
    k = max(k, ln(lf - 0.5, 0.03, aa * 22.0) * 0.3 * step(0.06, q.x) * step(q.x, 0.95));
    k = max(k, ln(q.x - 0.14, 0.004, aa * 2.0) * 0.35);
    float filled = step(li, 21.0) * step(8.0 - page * 14.0, li);
    float cell = floor(q.x * 46.0); float wr = step(0.38, h21(vec2(cell + page * 50.0, li))) * step(0.17, q.x) * step(q.x, 0.2 + 0.7 * h21(vec2(li, 3.0 + page)));
    k = max(k, wr * filled * ln(lf - 0.3, 0.09, aa * 22.0) * 0.8 * step(0.2, fract(q.x * 46.0)));
    k = max(k, ln(uv.x - 0.5, 0.004, aa) * 0.7);
    paper = vec3(0.7, 0.71, 0.66) * (1.0 - 0.25 * exp(-abs(uv.x - 0.5) * 30.0));
  } else {
    // the chronometer: enamel dial, sixty ticks, a seconds hand that steps
    vec2 c = uv - 0.5; float r = length(c); float a = atan(c.x, c.y + (abs(c.y) < 1e-5 ? 1e-4 : 0.0));
    float t60 = a / 6.2832 * 60.0; float tick = ln(fract(t60 + 0.5) - 0.5, 0.07, aa * 60.0 / max(r, 0.05) * 0.16);
    float five = ln(fract(t60 / 5.0 + 0.5) - 0.5, 0.035, aa * 12.0 / max(r, 0.05) * 0.16);
    k = max(k, tick * step(0.36, r) * step(r, 0.4)); k = max(k, five * step(0.33, r) * step(r, 0.4));
    float da = a - uHand; da = da - 6.2832 * floor(da / 6.2832 + 0.5);
    k = max(k, ln(da * r, 0.006, aa) * step(r, 0.37) * step(abs(da), 1.5));
    k = max(k, 1.0 - smoothstep(0.02, 0.02 + aa, r));
    vec2 c2 = c - vec2(0.0, -0.17); float r2 = length(c2); k = max(k, ln(r2 - 0.09, 0.003, aa) * 0.7);
    float brass = smoothstep(0.42, 0.42 + aa, r); paper = mix(vec3(0.8, 0.82, 0.8), vec3(0.5, 0.39, 0.2), brass); gl = brass; k *= 1.0 - brass;
    if (r > 0.5) discard;
  }
  vec3 alb = mix(paper, ink, clamp(k, 0.0, 1.0));
  vec3 dl = uLamp.xyz - vWp; float r2l = dot(dl, dl);
  float att = max(1.0 - r2l / (uLamp.w * uLamp.w), 0.0); att = att * att / (1.0 + r2l * 0.006);
  float ndl = clamp(dl.y * inversesqrt(max(r2l, 1e-3)) + 0.25, 0.0, 1.0);
  vec3 col = alb * (uAmb * (1.0 + 0.6 * vLift) + uLampCol * (att * ndl)) + uLampCol * (gl * att * 0.25);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------ steam from the cup (a few soft rising wisps)
const STEAM_VERT = /* glsl */`
attribute vec3 aS;
uniform float uTime; uniform vec3 uBase; uniform float uSize;
varying vec2 vQ; varying float vA;
void main(){
  float t = fract(uTime * (0.1 + 0.05 * aS.y) + aS.x);
  vec3 c = uBase + vec3(sin(uTime * 0.7 + aS.x * 30.0) * 0.5 * t + (aS.z - 0.5) * 0.5, t * 6.5 * uSize, cos(uTime * 0.5 + aS.x * 17.0) * 0.5 * t + (aS.y - 0.5) * 0.5);
  float sz = uSize * (0.5 + 1.9 * t);
  vec4 mvPosition = viewMatrix * vec4(c, 1.0);
  mvPosition.xy += position.xy * sz;
  vQ = position.xy; vA = smoothstep(0.0, 0.15, t) * (1.0 - t) * (1.0 - t);
  gl_Position = projectionMatrix * mvPosition;
}`;
const STEAM_FRAG = /* glsl */`
uniform vec3 uCol;
varying vec2 vQ; varying float vA;
void main(){
  float r = dot(vQ, vQ); float a = (1.0 - smoothstep(0.1, 1.0, r)) * vA;
  gl_FragColor = vec4(uCol * a, 1.0);
}`;

// ------------------------------------------------------------------ dust: motes that only shine where light is (the shaft from the slit, the lamps)
const dustVert = (LIGHT) => /* glsl */`
#define BEAM_STEPS 4
attribute vec4 aS;
uniform vec3 uBox; uniform float uSizeK; uniform float uDustGain; uniform vec3 uPiv; uniform vec3 uAx; uniform vec3 uE1; uniform vec3 uE2;
varying vec2 vQ; varying vec3 vCol;
${LIGHT}
void main(){
#ifdef TUBE
  // motes inside the telescope: they drift up the tube in the beam
  float sAx = mod(aS.x * 204.0 + uTime * 1.2 * (0.5 + aS.w), 204.0) - 91.0;
  float ang = aS.y * 6.2832 + uTime * 0.12 * (aS.w - 0.5); float rad = 8.5 * aS.z;
  vec3 P = uPiv + uAx * sAx + (uE1 * cos(ang) + uE2 * sin(ang)) * rad;
  vec3 rel = P - cameraPosition; float dist = length(rel);
  float fade = smoothstep(1.5, 7.0, dist) * (1.0 - smoothstep(110.0, 190.0, dist));
  // brightest in the cone of light down the axis; nearer the lens they take its blue and gold
  float gT = smoothstep(-100.0, 112.0, sAx);
  vec3 lit = (uStarCol * 0.55 + tubeRings(sAx, ang) * (0.25 + 0.75 * gT)) * (uStar * (0.45 + 0.55 * uTube.y) * (0.08 + 2.0 * exp(-rad * rad / 18.0)) * 1.5);
#elif defined(BAR)
  // motes in the bar of starlight round the upper tube: they climb slowly toward the slit, and each flashes as it turns
  float sAx = mod(aS.x * 150.0 + uTime * 0.7 * (0.4 + aS.w), 150.0) + 4.0;
  float ang = aS.y * 6.2832 + uTime * 0.05 * (aS.w - 0.5) + 0.25 * sin(uTime * 0.2 + aS.w * 30.0); float rad = 13.6 + 8.0 * aS.z * aS.z;      // a sleeve of air close round the tube, where the bar of light lies
  vec3 P = uPiv + uAx * sAx + (uE1 * cos(ang) + uE2 * sin(ang)) * rad;
  vec3 rel = P - cameraPosition; float dist = length(rel);
  float fade = smoothstep(6.0, 20.0, dist) * (1.0 - smoothstep(170.0, 260.0, dist)) * smoothstep(4.0, 22.0, sAx) * (1.0 - smoothstep(138.0, 154.0, sAx));
  vec3 lit = mix(uStarCol, vec3(0.7, 0.84, 1.0), 0.5) * (uStar * slitMask(P) * smoothstep(0.0, 22.0, uSlit.x));
#else
  vec3 drift = vec3(0.6, 0.18, 0.32) * uTime + vec3(sin(uTime * 0.31 + aS.w * 40.0), sin(uTime * 0.23 + aS.w * 70.0), cos(uTime * 0.27 + aS.w * 55.0)) * 1.8;
  vec3 rel = mod(aS.xyz * uBox + drift - cameraPosition, uBox) - 0.5 * uBox;
  vec3 P = cameraPosition + rel;
  vec3 e = 0.5 * uBox - abs(rel); float fade = clamp(min(min(e.x, e.y), e.z) / 6.0, 0.0, 1.0);
  float dist = length(rel); fade *= smoothstep(5.0, 16.0, dist);
  vec3 pc = P - uCtr; float inDome = step(dot(pc, pc), uSlit.w * uSlit.w) * smoothstep(0.0, 22.0, uSlit.x);
  vec3 lit = uStarCol * (uStar * slitMask(P) * inDome * tubeShadow(P));
  for (int i = 0; i < 8; i++) { vec3 d = uLampPos[i].xyz - P; float r2 = dot(d, d); float rr = uLampPos[i].w * 0.6; float att = max(1.0 - r2 / max(rr * rr, 1.0), 0.0); lit += uLampCol[i] * (att * att / (1.0 + r2 * 0.03) * 0.6); }
  { vec3 pa = P - uCtr; float sa = dot(pa, uKeyDir); vec3 qa = pa - uKeyDir * sa; float wq = max(uShaft.y, 1.0);      // motes in the shaft round the tube
    lit += uStarCol * (uStar * uShaft.x * 7.0 * exp(-dot(qa, qa) / (wq * wq)) * smoothstep(uShaft.z, uShaft.z + 30.0, sa) * (1.0 - smoothstep(uShaft.w - 14.0, uShaft.w + 4.0, sa))); }
#endif
  lit = mix(lit, uFlash.rgb * dot(lit, vec3(0.5)), uFlash.a);
  float tw = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(uTime * (1.5 + 3.0 * fract(aS.w * 7.0)) + aS.w * 90.0), 4.0);
#ifdef BAR
  { float sp = clamp(0.5 + 0.5 * sin(uTime * (1.1 + 2.6 * fract(aS.w * 7.0)) + aS.w * 90.0), 0.0, 1.0); sp *= sp; sp *= sp; sp *= sp; tw = 0.02 + 2.6 * sp * sp; }      // dark between flashes: a glitter, not a haze
#endif
#ifdef TUBE
  float s0 = 0.03 + 0.07 * fract(aS.w * 13.0); fade *= smoothstep(8.0, 30.0, dist);
#elif defined(BAR)
  float s0 = 0.035 + 0.06 * fract(aS.w * 13.0);
#else
  float s0 = 0.02 + 0.045 * fract(aS.w * 13.0);
#endif
  float s = max(s0, dist * uSizeK); float k = s0 / s;
  vCol = lit * (tw * fade * max(k * k, 0.05) * uDustGain);
  vec4 mv = viewMatrix * vec4(P, 1.0); mv.xy += position.xy * s;
  vQ = position.xy; gl_Position = projectionMatrix * mv;
}`;
const DUST_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vCol;
void main(){ float a = 1.0 - smoothstep(0.0, 1.0, dot(vQ, vQ)); gl_FragColor = vec4(vCol * (a * a), 1.0); }`;

// ------------------------------------------------------------------ the building round the hero: one static mesh in the hero's light
async function buildDrum(ctx, hero, C, G) {
  const R = 160, tick = () => ctx.yield();
  // brick drum, flagged ambulatory under the balcony, the lip of the well the deck rides in
  G.rand = 0.3; G.uvOn = true; G.set(12, C.brick);
  G.lathe([[R, -1, 0.45], [R, 44, 0.5], [R, 51, 0.55], [R, 64, 0.85], [R, 100, 1], [R, 135.8, 0.85]], 96, { inward: true, rRef: R });
  G.set(13, C.flag); G.lathe([[R, 0, 0.5], [142, 0, 0.55], [125.6, 0, 0.9]], 96, { rRef: 142 });
  G.set(12, C.brick, 0.7); G.lathe([[125.6, -16, 0.15], [125.6, 0, 0.8]], 96, { inward: true, rRef: 125.6 });
  await tick();
  // the fixed balcony at the risen floor's level: boards that continue the deck's rings, a riveted girder, joists
  G.uvOn = false; G.rand = 0.4; G.set(8, C.deck); G.lathe([[R, 50], [148, 50], [137, 50], [126.4, 50]], 96);
  G.uvOn = true; G.rand = 0.6; G.set(0, C.iron);
  G.lathe([[127.6, 45.2], [125.9, 45.4], [125.9, 46.1], [126.4, 46.3], [126.4, 49.3], [125.9, 49.5], [125.9, 50.3], [126.4, 50.3]], 96, { inward: true, rRef: 126.4 });
  G.uvOn = false; G.set(0, C.ironDark); G.lathe([[127.6, 45.2, 0.5], [R, 45.2, 0.3]], 96);
  for (let i = 0; i < 48; i++) { G.push().rotY(i / 48 * TAU).move(0, 44.3, 143.8); G.box(0.45, 0.9, 16.0, 0.1); G.pop(); }
  await tick();
  // cast-iron columns under the balcony, with braces
  for (let i = 0; i < 24; i++) {
    G.push().rotY(i / 24 * TAU).move(0, 0, 129.6); G.rand = 0.2 + 0.03 * (i % 7); G.set(0, C.iron, 0.9 + 0.2 * ((i * 5) % 3) / 3);
    G.lathe([[2.5, 0], [2.5, 1.0], [2.0, 1.5], [1.6, 2.6], [1.3, 3.4], [1.3, 4.2], [1.55, 4.4], [1.55, 5.0], [1.2, 5.3], [1.1, 37.6], [1.4, 38], [1.4, 38.8], [1.15, 39.2], [1.9, 41.4], [2.6, 42.4], [2.6, 43.4]], 12);
    for (const s of [-1, 1]) { G.push().move(s * 3.4, 40.6, 0).rotZ(-s * 0.9); G.box(0.28, 4.6, 0.3, 0.08); G.pop(); }
    G.push().move(0, 41, -2.3).rotX(0.8); G.box(0.3, 3.2, 0.32, 0.08); G.pop();
    G.pop();
    if ((i & 7) === 7) await tick();
  }
  // railing round the well: posts and two rails
  G.set(0, C.iron, 1.15); G.rand = 0.5;
  for (let i = 0; i < 96; i++) { G.push().rotY((i + 0.5) / 96 * TAU).move(0, 53.0, 127.3); G.box(0.22, 3.0, 0.22, 0.06); G.pop(); }
  G.set(1, C.brassV); G.push().move(0, 56.1, 0); G.torus(127.3, 0.4, 96, 5); G.pop();
  G.set(0, C.iron, 1.15); G.push().move(0, 53.2, 0); G.torus(127.3, 0.26, 96, 4); G.pop();
  await tick();
  // string course, cornice, pilasters
  G.set(0, C.stone); G.rand = 0.7;
  G.lathe([[R, 60.6], [158.7, 61.2], [158.7, 62.6], [159.3, 63.1], [R, 63.6]], 96, { inward: true });
  G.lathe([[R, 125], [158.6, 126.4], [158.6, 128.6], [157.2, 130.2], [157.2, 132.8], [155.8, 134.2], [155.8, 135.8]], 96, { inward: true });
  for (let i = 0; i < 24; i++) {
    G.push().rotY(i / 24 * TAU);
    G.uvOn = true; G.set(12, C.brick, 1.08); G.rand = 0.1 * (i % 5); G.push().move(0, 88.5, 159.1); G.box(2.6, 36.5, 1.0, 0.2); G.pop();
    G.uvOn = false; G.set(0, C.stone, 0.95); G.push().move(0, 51.3, 158.9); G.box(3.1, 1.3, 1.3, 0.25); G.pop();
    G.push().move(0, 124.3, 158.8); G.box(3.2, 0.9, 1.4, 0.25); G.pop();
    G.pop();
  }
  await tick();
  // arched windows with stone surrounds and closed louvred shutters
  for (let i = 0; i < 24; i++) {
    G.push().rotY((i + 0.5) / 24 * TAU); G.uvOn = false; G.rand = 0.15 + 0.033 * i;
    G.set(4, C.black); G.poly([[-7, 66, 159.75], [7, 66, 159.75], [7, 96, 159.75], [-7, 96, 159.75]], [0, 0, -1]);
    G.set(0, C.stone, 1.0);
    for (const s of [-1, 1]) { G.push().move(s * 7.6, 77, 159.1); G.box(0.95, 11, 0.9, 0.2); G.pop(); }
    for (let k = 0; k < 10; k++) { const a = (k + 0.5) / 10 * Math.PI; G.push().move(0, 88, 159.1).rotZ(a).move(7.6, 0, 0); G.box(0.95, 1.28, 0.9, 0); G.pop(); }
    G.push().move(0, 96.3, 158.8); G.box(1.1, 1.5, 1.2, 0.2); G.pop();
    G.push().move(0, 65.2, 158.7); G.box(9.4, 0.8, 1.3, 0.25); G.pop();
    // shutter leaves: stiles, slats, a boarded lunette above
    const ajar = (i * 7) % 11 === 3 ? 0.35 : 0;
    G.set(3, C.shutter, 0.85 + 0.25 * ((i * 3) % 4) / 4);
    for (const s of [-1, 1]) {
      G.push().move(s * 6.65, 0, 159.45).rotY(-s * ajar * (s > 0 ? 1 : 0)).move(-s * 3.32, 0, 0);
      for (const e of [-1, 1]) { G.push().move(e * 3.05, 77, 0); G.box(0.28, 11, 0.22, 0); G.pop(); }
      for (let k = 0; k < 12; k++) { G.push().move(0, 67 + k * 1.75, 0).rotX(0.6); G.box(2.8, 0.1, 0.55, 0); G.pop(); }
      G.pop();
    }
    const fan = [[0, 88, 159.4]]; for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI; fan.push([6.65 * Math.cos(a), 88 + 6.65 * Math.sin(a), 159.4]); }
    G.uvOn = true; G.poly(fan, [0, 0, -1], fan.map((p) => [p[1], p[0] * 3])); G.uvOn = false;
    G.push().move(0, 88, 159.3); G.box(6.65, 0.3, 0.2, 0); G.pop();
    G.pop();
    if ((i & 3) === 3) await tick();
  }
  // the iron gallery near the top of the drum: plate, brackets, railing
  G.uvOn = true; G.set(0, C.iron, 0.9); G.rand = 0.45;
  G.lathe([[R, 110], [152, 110]], 96, { rRef: 156 }); G.lathe([[152, 109.3], [152, 110]], 96, { inward: true, rRef: 152 });
  G.uvOn = false; G.set(0, C.ironDark); G.lathe([[152, 109.3, 0.6], [R, 109.3, 0.4]], 96);
  G.set(0, C.iron, 1.0);
  for (let i = 0; i < 48; i++) { G.push().rotY(i / 48 * TAU).move(0, 106.4, 156.6).rotX(-0.62); G.box(0.22, 0.28, 4.6, 0.06); G.pop(); }
  for (let i = 0; i < 96; i++) { G.push().rotY((i + 0.5) / 96 * TAU).move(0, 112.6, 152.3); G.box(0.2, 2.6, 0.2, 0.05); G.pop(); }
  G.push().move(0, 115.3, 0); G.torus(152.3, 0.36, 96, 5); G.pop(); G.push().move(0, 112.7, 0); G.torus(152.3, 0.24, 96, 4); G.pop();
  await tick();
  // four hoists for the rising floor: A-frames on the balcony, a sheave over the deck's rim, a winch, running cables
  for (let k = 0; k < 4; k++) {
    G.push().rotY(Math.PI / 4 + k * Math.PI / 2 + 0.065); G.uvOn = false; G.rand = 0.3 + 0.1 * k;
    G.set(0, C.iron, 1.1);
    for (const s of [-1, 1]) { G.tube([[s * 3.4, 50, 137], [s * 1.2, 69, 124.4]], 0.5, 6); G.tube([[s * 3.4, 50, 131], [s * 1.2, 69, 124.4]], 0.34, 5); }
    G.tube([[-2.4, 59.5, 131], [2.4, 59.5, 131]], 0.3, 5); G.tube([[-1.3, 69, 124.4], [1.3, 69, 124.4]], 0.32, 6);
    G.set(1, C.brassV); G.push().move(0, 69, 124.4).rotZ(Math.PI / 2); G.lathe([[0.3, -0.45], [2.3, -0.38], [1.9, 0], [2.3, 0.38], [0.3, 0.45]], 18); G.pop();
    G.set(0, C.ironDark, 1.6); G.push().move(0, 51.6, 139); G.box(2.2, 1.6, 2.0, 0.3); G.pop();
    G.set(6, C.steel); G.push().move(0, 53.6, 139).rotZ(Math.PI / 2); G.lathe([[1.5, -1.9], [1.5, -1.7], [1.1, -1.6], [1.1, 1.6], [1.5, 1.7], [1.5, 1.9]], 14); G.pop();
    G.set(10, C.rope); G.tube([[0, 67.2, 122.5], [0, 34, 122.5], [0, 0.4, 122.5]], 0.34, 5); G.tube([[0, 70.6, 125.6], [0, 54.6, 139]], 0.3, 5);
    G.pop();
  }
  await tick();
  // twelve ruby sconces on the drum wall above the balcony, one on every second pilaster (the hero's light rig has them as a ring)
  for (let i = 0; i < 12; i++) {
    G.push().rotY((i + 0.5) / 12 * TAU).move(0, 56.2, 156.9); G.uvOn = false; G.rand = 0.4;
    G.set(0, C.ironDark, 1.6); G.push().move(0, 0.2, 0.7); G.box(0.22, 0.22, 0.9, 0.06); G.pop(); G.push().move(0, -1.3, 1.0).rotX(-0.8); G.box(0.16, 0.16, 1.2, 0.05); G.pop();
    G.set(1, C.brassV); G.lathe([[0.12, 0], [0.85, 0.12], [0.85, 0.35], [0.55, 0.5]], 10); G.lathe([[0.55, 2.3], [0.9, 2.45], [0.6, 2.9], [0.14, 3.3], [0.01, 3.36]], 10);
    G.set(5, C.sconce, 1); G.ao = 0.8; G.rand = 0; G.lathe([[0.55, 0.5], [0.72, 1.4], [0.55, 2.3]], 10, { smooth: true }); G.ao = 1;
    G.pop();
  }
  await tick();
}

// ------------------------------------------------------------------ more of the astronomers' things on the deck (deck-local): rugs, a chart
// table, a celestial globe, a transit on its tripod, a plate cabinet and crates, the regulator clock. Returns where its lanterns stand.
function buildDeckExtras(C, G, deskRug) {
  const lamps = [], rz = (x, z, r, lx, lz) => [x + lx * Math.cos(r) + lz * Math.sin(r), z - lx * Math.sin(r) + lz * Math.cos(r)];
  // where each thing stands on the boards, for its contact shadow: centre x and z, half sizes, turn, strength, softness in metres
  const feet = [], foot = (x, z, hx, hz, rot = 0, k = 0.5, soft = 3) => feet.push([x, z, hx, hz, rot, k, soft]);
  const rug = (x, z, w, d, rot) => { G.uvOn = true; G.rand = 0.5; G.set(14, C.paper); G.push().move(x, 0.07, z).rotY(rot);
    G.poly([[-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [w / 2, 0, d / 2], [-w / 2, 0, d / 2]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]); G.pop(); G.uvOn = false; };
  const glass = (y) => { G.set(1, C.brassV); G.lathe([[0.1, y], [0.75, y + 0.1], [0.75, y + 0.3], [0.5, y + 0.42]], 10); G.lathe([[0.5, y + 1.9], [0.8, y + 2.0], [0.55, y + 2.4], [0.12, y + 2.75], [0.01, y + 2.8]], 10);
    G.set(5, C.rubyGlass, 1); G.ao = 0.75; G.rand = 0; G.lathe([[0.5, y + 0.42], [0.62, y + 1.15], [0.5, y + 1.9]], 10, { smooth: true }); G.ao = 1; G.rand = 0.5; };
  const stand = (x, z, h) => { G.push().move(x, 0, z); G.set(0, C.ironDark, 1.8); G.lathe([[1.3, 0], [1.3, 0.3], [0.5, 0.7], [0.3, 1.2], [0.3, h - 0.7], [0.55, h - 0.5], [0.55, h]], 8); glass(h); G.pop(); lamps.push([x, h + 1.15, z]); foot(x, z, 1.3, 1.3, 0, 0.45, 2); };
  const table = (w, d, h) => {
    G.set(3, C.wood, 1.15); G.push().move(0, h - 0.3, 0); G.box(w, 0.3, d, 0.12); G.pop();
    G.set(3, C.wood, 0.8); G.push().move(0, h - 1.1, 0); G.box(w - 0.6, 0.5, d - 0.6, 0.1); G.pop();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { G.push().move(sx * (w - 0.9), 0, sz * (d - 0.9)); G.lathe([[0.5, 0], [0.5, 0.5], [0.3, 0.9], [0.42, h * 0.45], [0.28, h * 0.6], [0.45, h - 1.6]], 8); G.pop(); }
    G.push().move(0, 1.6, 0); G.box(w - 1.0, 0.16, 0.22, 0.05); G.pop();
  };
  const crate = (x, y, z, hx, hy, hz, r, k) => { G.set(3, C.wood, k); G.push().move(x, y + hy, z).rotY(r); G.box(hx, hy, hz, 0.14);
    G.set(3, C.wood, k * 0.7); for (const sy of [-1, 1]) { G.push().move(0, sy * (hy - 0.35), 0); G.box(hx + 0.08, 0.22, hz + 0.08, 0.05); G.pop(); } G.pop();
    if (y === 0) foot(x, z, hx, hz, r, 0.6, 2.5); };      // (a crate on the boards; one stacked on another or on the bench has no foot of its own)
  G.uvOn = false; G.rand = 0.5;
  rug(deskRug[0], deskRug[1], 29, 45.6, deskRug[2]);
  // the chart table inside the north-east door, left of the way in: rolled charts, books, dividers, a small lantern, a stool
  { const x = 19.8, z = -78.7, r = -0.75; rug(x, z, 16, 25, r + Math.PI / 2);
    G.push().move(x, 0, z).rotY(r); table(8, 4.6, 8.5); foot(x, z, 8, 4.6, r, 0.5, 4);
    for (let k = 0; k < 4; k++) { G.set(3, C.paper, 0.8 + 0.1 * k); G.push().move(-4.5 + k * 0.5, 9.0 + (k === 3 ? 0.75 : 0), -2.6 + k * 0.85 - (k === 3 ? 1.2 : 0)).rotY(0.12 * k).rotZ(Math.PI / 2); G.lathe([[0.01, -3.4], [0.42, -3.4], [0.42, 3.4], [0.01, 3.4]], 8); G.pop(); }
    const bk = [C.navy, C.bookRed, C.bookGreen, C.navy]; for (let k = 0; k < 4; k++) { G.set(3, bk[k], 1.2); G.push().move(3.2, 8.75 + k * 0.5, 2.2).rotY(0.3 * k - 0.4); G.box(1.5 - 0.1 * k, 0.24, 1.1, 0.06); G.pop(); }
    G.set(1, C.brassV); G.push().move(0.4, 8.6, 1.4).rotY(0.5); for (const sg of [-1, 1]) { G.push().rotY(sg * 0.22); G.box(0.07, 0.07, 1.9, 0.02); G.pop(); } G.push().move(0, 0.1, -1.8); G.lathe([[0.01, 0], [0.26, 0.05], [0.26, 0.22], [0.01, 0.3]], 8); G.pop(); G.pop();
    G.push().move(5.6, 8.5, -2.4); G.set(0, C.ironDark, 1.8); G.lathe([[0.8, 0], [0.8, 0.2], [0.3, 0.4]], 8); glass(0.3); G.pop();
    G.pop();
    const lp = rz(x, z, r, 5.6, -2.4); lamps.push([lp[0], 10.0, lp[1]]);
    const sp = rz(x, z, r, -2, -8.5); G.set(3, C.wood, 0.85); G.push().move(sp[0], 0, sp[1]); G.lathe([[2.0, 5.2], [2.0, 5.6], [0.01, 5.6]], 14); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; G.tube([[Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9], [Math.cos(a) * 1.2, 5.3, Math.sin(a) * 1.2]], 0.22, 5); } G.pop(); foot(sp[0], sp[1], 2, 2, 0, 0.5, 2.5); }
  // a celestial globe beside it, nearer the door: tripod, column, brass horizon and meridian rings, the night-blue sphere
  { foot(29, -72.5, 3.3, 3.3, 0.6, 0.5, 3); G.push().move(29, 0, -72.5).rotY(0.6);
    G.set(3, C.wood, 0.9); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; G.tube([[Math.cos(a) * 3.2, 0.2, Math.sin(a) * 3.2], [Math.cos(a) * 1.4, 1.6, Math.sin(a) * 1.4], [0, 2.6, 0]], (t) => 0.42 - 0.12 * t, 6); }
    G.lathe([[0.7, 2.2], [0.5, 2.8], [0.34, 3.4], [0.5, 4.2], [0.3, 4.8], [0.3, 5.6], [1.6, 6.0], [3.9, 6.5]], 12);
    G.set(1, C.brassV); G.push().move(0, 6.7, 0); G.torus(4.15, 0.22, 36, 6); G.pop();
    G.push().move(0, 6.7, 0).rotZ(0.41); G.push().rotX(Math.PI / 2); G.torus(3.85, 0.16, 36, 6); G.pop();
    G.set(3, C.globe, 1); G.rand = 0.8; G.ball(3.6, 24, 14);
    G.set(1, C.brassV, 1.1); for (const sy of [-1, 1]) { G.push().move(0, sy * 3.7, 0); G.lathe([[0.01, -0.25], [0.3, -0.2], [0.3, 0.2], [0.01, 0.25]], 8); G.pop(); }
    G.pop(); G.pop(); G.rand = 0.5; }
  // west: a transit instrument on its tripod, the case it came in, a lantern on a stand
  { foot(-80, -22, 5, 5, -0.5, 0.4, 4); G.push().move(-80, 0, -22).rotY(-0.5);
    G.set(3, C.wood, 1.0); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.3; G.tube([[Math.cos(a) * 5.2, 0, Math.sin(a) * 5.2], [Math.cos(a) * 0.5, 11.6, Math.sin(a) * 0.5]], (t) => 0.5 - 0.15 * t, 6); G.tube([[Math.cos(a) * 3.0, 4.9, Math.sin(a) * 3.0], [Math.cos(a + 2.094) * 3.0, 4.9, Math.sin(a + 2.094) * 3.0]], 0.16, 5); }
    G.set(1, C.brassV); G.lathe([[0.9, 11.4], [1.1, 11.8], [1.1, 12.4], [0.5, 12.7], [0.5, 13.6]], 12);
    for (const sx of [-1, 1]) { G.push().move(sx * 2.2, 14.6, 0); G.box(0.22, 1.5, 0.5, 0.1); G.pop(); }
    G.push().move(0, 13.4, 0); G.box(2.5, 0.25, 0.7, 0.1); G.pop();
    G.push().move(0, 15.6, 0).rotX(-0.9); G.lathe([[0.01, -6.6], [0.5, -6.6], [0.5, -5.6], [0.7, -5.2], [0.7, 5.6], [1.0, 6.0], [1.0, 7.4], [0.8, 7.4], [0.01, 7.3]], 14);
    G.push().rotZ(Math.PI / 2); G.lathe([[0.01, -2.3], [0.4, -2.3], [0.4, 2.3], [0.01, 2.3]], 10); G.pop();
    G.push().move(1.9, 0, 0).rotZ(Math.PI / 2); G.lathe([[0.01, -0.12], [2.0, -0.1], [2.0, 0.1], [0.01, 0.12]], 24); G.pop(); G.pop();
    G.pop();
    crate(-70, 0, -30, 4.2, 1.5, 1.6, 0.5, 0.9); crate(-69, 3.0, -30.5, 1.6, 0.9, 1.2, 0.9, 1.1); stand(-71, -13, 5.4); }
  // south-west: the plate cabinet (twelve drawers with brass pulls), crates, a coil of rope, a lantern
  { foot(-60, 60, 5.2, 2.4, 2.3, 0.6, 3); G.push().move(-60, 0, 60).rotY(2.3); G.set(3, C.wood, 0.95); G.push().move(0, 6.2, 0); G.box(5.2, 6.2, 2.4, 0.2); G.pop();
    G.push().move(0, 12.6, 0); G.box(5.5, 0.3, 2.7, 0.12); G.pop();
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { G.set(3, C.wood, 1.15 + 0.1 * ((i + j) % 2)); G.push().move(-3.3 + i * 3.3, 1.9 + j * 2.9, 2.45); G.box(1.45, 1.2, 0.1, 0.06); G.set(1, C.brassV); G.push().move(0, 0, 0.2).rotX(Math.PI / 2); G.lathe([[0.01, -0.1], [0.24, -0.08], [0.24, 0.1], [0.01, 0.16]], 8); G.pop(); G.pop(); }
    G.pop();
    crate(-49, 0, 66, 2.8, 1.9, 2.2, 0.3, 0.85); crate(-45.5, 0, 61, 2.0, 1.4, 2.0, 1.1, 1.0); crate(-49.4, 3.8, 66.3, 1.9, 1.2, 1.6, 0.7, 1.1);
    foot(-56, 72, 2.7, 2.7, 0, 0.5, 2); G.set(10, C.rope); G.push().move(-56, 0.4, 72); for (let k = 0; k < 4; k++) { G.push().move(0, k * 0.62, 0); G.torus(2.4 - 0.15 * k, 0.36, 24, 5); G.pop(); } G.pop();
    stand(-52, 53, 5.4); }
  // east, beyond the tail: the regulator clock in its tall case (dial, a pendulum that swings: bone 19), a bench of instrument cases
  const pend = [58, 17.6, -22];
  { foot(58, -22, 3.3, 2.0, -Math.PI / 2 - 0.3, 0.6, 3); foot(49, -34, 7.5, 2.2, 0.25, 0.5, 3);      // the regulator's case and the bench of instrument cases
    G.push().move(58, 0, -22).rotY(-Math.PI / 2 - 0.3);
    G.set(3, C.wood, 0.9); G.push().move(0, 1.6, 0); G.box(3.3, 1.6, 2.0, 0.2); G.pop();
    for (const sx of [-1, 1]) { G.push().move(sx * 2.45, 11, 0); G.box(0.35, 7.9, 1.6, 0.1); G.pop(); }
    G.push().move(0, 11, -1.4); G.box(2.2, 7.9, 0.2, 0.05); G.pop();
    G.push().move(0, 21.6, 0); G.box(3.2, 2.9, 1.9, 0.25); G.pop(); G.push().move(0, 24.9, 0); G.box(3.5, 0.4, 2.2, 0.15); G.pop();
    G.set(1, C.brassV, 1.1); G.push().move(0, 21.6, 1.92).rotX(Math.PI / 2); G.lathe([[2.35, -0.1], [2.35, 0], [2.2, 0.08], [0.01, 0.08]], 28); G.pop();
    G.set(3, C.paper, 1.25); G.push().move(0, 21.6, 2.02).rotX(Math.PI / 2); G.lathe([[1.95, 0.02], [0.01, 0.02]], 28); G.pop();
    G.set(0, C.ironDark, 0.6); G.push().move(0, 21.6, 2.08); G.push().rotZ(0.9); G.push().move(0, 0.65, 0); G.box(0.07, 0.75, 0.03, 0); G.pop(); G.pop(); G.push().rotZ(-2.2); G.push().move(0, 0.45, 0); G.box(0.09, 0.5, 0.03, 0); G.pop(); G.pop(); G.pop();
    G.pop();
    // the pendulum is built in deck coordinates so its bone can swing it about the pivot
    G.bone = 19; G.push().move(58, 0, -22).rotY(-Math.PI / 2 - 0.3); G.set(6, C.steel, 0.9); G.push().move(0, 12.4, 0.2); G.box(0.09, 5.2, 0.06, 0.02); G.pop();
    G.set(1, C.brassV, 1.2); G.push().move(0, 7.0, 0.2).rotX(Math.PI / 2); G.lathe([[0.01, -0.28], [1.25, -0.12], [1.25, 0.12], [0.01, 0.28]], 20); G.pop(); G.pop(); G.bone = 0;
    G.push().move(49, 0, -34).rotY(0.25); G.set(3, C.wood, 0.85); G.push().move(0, 4.4, 0); G.box(7.5, 0.3, 2.2, 0.1); G.pop();
    for (const sx of [-1, 1]) { G.push().move(sx * 6.4, 2.1, 0); G.box(0.3, 2.1, 1.9, 0.08); G.pop(); }
    G.pop(); crate(46, 4.7, -35, 2.2, 1.0, 1.4, 0.4, 1.1); crate(52.5, 4.7, -33, 1.5, 1.6, 1.3, 0.1, 0.75);
    G.set(1, C.brassV); G.push().move(49.5, 5.6, -34).rotY(0.25).rotZ(Math.PI / 2 - 0.2); G.lathe([[0.01, -2.4], [0.5, -2.4], [0.5, -1.6], [0.62, -1.4], [0.62, 2.0], [0.8, 2.2], [0.8, 2.8], [0.01, 2.8]], 12); G.pop();
    stand(51, -12, 5.4); }
  return { lamps, pend, feet };
}

// ------------------------------------------------------------------ things that ride the rising deck (deck-local: y = 0 is the boards)
function buildDeckSet(hero, C, G, desk, chair) {
  // where each thing stands on the boards, for its contact shadow (as in buildDeckExtras): the desk and the chair first
  const feet = [], foot = (x, z, hx, hz, rot = 0, k = 0.5, soft = 3) => feet.push([x, z, hx, hz, rot, k, soft]);
  if (desk.half) foot(desk.x, desk.z, desk.half[0], desk.half[1], desk.rot || 0, 0.5, 4);
  if (chair) foot(chair.x, chair.z, chair.w / 2, chair.d / 2, chair.ry, 0.55, 2.5);
  // the wheeled observing ladder, waiting east of the tail
  G.uvOn = false; G.rand = 0.55;
  foot(17, -65, 3.0, 5.8, Math.PI / 2 - 0.25, 0.45, 3);
  G.push().move(17, 0, -65).rotY(Math.PI / 2 - 0.25);       // local +z looks west, toward the eyepiece
  G.rand = 0.5625;      // (the hero's shader knows the ladder by this: its timber and iron keep their own colours under the lamps and take only a tint)
  G.set(3, C.wood);
  for (const s of [-1, 1]) {
    G.push().move(s * 2.6, 1.9, 0); G.box(0.35, 0.35, 5.6, 0.1); G.pop();                       // base rails
    G.push().move(s * 2.2, 12.1, -0.2).rotX(-0.3); G.box(0.3, 10.9, 0.5, 0.1); G.pop();         // stringers, leaning
    G.push().move(s * 2.6, 11.6, -4.4); G.box(0.3, 9.9, 0.3, 0.08); G.pop();                    // back posts
    G.push().move(s * 2.6, 8.5, -1.2).rotX(0.62); G.box(0.16, 0.25, 5.4, 0.05); G.pop();        // braces
  }
  for (const z of [-5.2, 5.2]) { G.push().move(0, 1.9, z); G.box(2.9, 0.35, 0.35, 0.1); G.pop(); }
  for (let k = 0; k < 13; k++) { const y = 3.3 + k * 1.48; G.push().move(0, y, 3.1 - (y - 1.9) * 0.309); G.box(2.2, 0.14, 0.48, 0.04); G.pop(); }
  G.push().move(0, 21.6, -3.5); G.box(3.0, 0.22, 2.4, 0.08); G.pop();                            // platform
  // the platform's guard rail: turned iron posts with brass caps, an iron hand rail and a timber knee rail
  for (const s of [-1, 1]) for (const z of [-1.3, -5.6]) { G.push().move(s * 2.8, 21.8, z); G.set(0, C.ironDark, 1.9); G.lathe([[0.42, 0], [0.42, 0.3], [0.26, 0.5], [0.2, 2.0], [0.28, 2.2], [0.2, 2.4], [0.2, 4.0]], 8);
    G.set(1, C.brassV); G.lathe([[0.2, 4.0], [0.36, 4.1], [0.4, 4.45], [0.24, 4.75], [0.01, 4.8]], 8); G.pop(); }
  // (turned bars, not G.tube: a tube carries plate coordinates, and painted iron or brass then takes rivet relief far too coarse for a
  // thin rail, which shows as a row of pale rings along the bar)
  G.set(0, C.ironDark, 2.6);
  for (const s of [-1, 1]) { G.push().move(s * 2.8, 26.05, -3.45).rotX(Math.PI / 2); G.lathe([[0.3, -2.2], [0.3, 2.2]], 8); G.pop(); }
  G.push().move(0, 26.05, -5.6).rotZ(Math.PI / 2); G.lathe([[0.3, -2.85], [0.3, 2.85]], 8); G.pop();
  G.set(3, C.wood, 1.1);
  for (const s of [-1, 1]) { G.push().move(s * 2.8, 23.9, -3.45); G.box(0.12, 0.26, 2.15, 0.05); G.pop(); }
  G.push().move(0, 23.9, -5.6); G.box(2.8, 0.26, 0.12, 0.05); G.pop();
  G.set(0, C.ironDark, 1.8);
  for (const s of [-1, 1]) for (const z of [-4.6, 4.6]) { G.push().move(s * 3.05, 1.0, z).rotZ(Math.PI / 2); G.lathe([[0.25, -0.3], [1.0, -0.25], [1.0, 0.25], [0.25, 0.3]], 12); G.pop(); }
  G.pop(); G.rand = 0.55;
  // a stool and a crate of eyepieces by the ladder, an instrument trolley south-east of the pier
  foot(27, -58, 2, 2, 0, 0.5, 2.5); foot(39.5, -63, 3.6, 2.4, 0.4, 0.6, 2.5); foot(34, 52, 5.0, 3.0, 0.7, 0.45, 3);
  G.set(3, C.wood, 0.85); G.push().move(27, 0, -58); G.lathe([[2.0, 3.6], [2.0, 4.0], [0.01, 4.0]], 14); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; G.tube([[Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7], [Math.cos(a) * 1.2, 3.7, Math.sin(a) * 1.2]], 0.22, 5); } G.pop();
  G.push().move(39.5, 1.5, -63).rotY(0.4); G.box(3.6, 1.5, 2.4, 0.15); G.set(1, C.brassV);
  for (let k = 0; k < 4; k++) { G.push().move(-2.2 + k * 1.45, 1.5, (k % 2) * 0.5 - 0.3); G.lathe([[0.5, 0], [0.5, 1.0], [0.35, 1.2], [0.35, 1.8], [0.01, 1.85]], 10); G.pop(); }
  G.pop();
  G.push().move(34, 0, 52).rotY(0.7); G.set(3, C.wood, 0.9);
  G.push().move(0, 5.2, 0); G.box(5.0, 0.3, 3.0, 0.1); G.pop(); G.push().move(0, 2.0, 0); G.box(4.6, 0.2, 2.6, 0.08); G.pop();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { G.push().move(sx * 4.4, 2.8, sz * 2.5); G.box(0.25, 2.6, 0.25, 0.06); G.pop(); }
  G.set(1, C.brassV); G.push().move(-1, 6.6, 0).rotZ(Math.PI / 2 - 0.25); G.lathe([[0.9, -3.4], [1.1, -3.2], [1.1, -2.2], [0.8, -2.0], [0.8, 2.6], [1.3, 2.9], [1.3, 3.6], [0.9, 3.6]], 14); G.pop();
  G.push().move(2.6, 5.5, 0.6); G.lathe([[1.2, 0], [1.2, 0.3], [0.3, 0.6], [0.3, 2.0], [0.9, 2.3], [0.9, 2.9], [0.01, 3.0]], 12); G.pop();
  G.pop();
  // eyes where the four hoist cables take the deck
  G.set(0, C.ironDark, 1.8);
  for (let k = 0; k < 4; k++) { G.push().rotY(Math.PI / 4 + k * Math.PI / 2 + 0.065).move(0, 0.5, 122.5); G.box(0.9, 0.5, 0.9, 0.15); G.pop(); }
  // on the desk: brass chart weights, the chronometer's box with its lid up
  const top = desk.top;
  G.push().move(desk.x, top, desk.z).rotY(desk.rot || 0);
  G.set(1, C.brassV);
  for (const w of desk.weights) { G.push().move(w[0], 0.03, w[1]); G.lathe([[0.75, 0], [0.8, 0.12], [0.8, 0.5], [0.55, 0.62], [0.2, 0.66], [0.2, 0.95], [0.32, 1.1], [0.01, 1.2]], 12); G.pop(); }
  G.set(3, C.wood, 0.8); G.push().move(desk.chrono[0], 0.75, desk.chrono[1]).rotY(0.3);
  G.box(1.9, 0.75, 1.9, 0.12); G.push().move(0, 2.2, -2.05).rotX(-0.18); G.box(1.9, 1.75, 0.14, 0.05); G.pop();
  G.set(1, C.brassV); for (const sx of [-1, 1]) { G.push().move(sx * 1.92, 0.2, 1.3); G.box(0.06, 0.35, 0.25, 0); G.pop(); }
  G.pop(); G.pop();
  // the astronomer's coat over the pushed-back chair
  if (chair) {
    G.push().move(chair.x, 0, chair.z).rotY(chair.ry); G.rand = 0.9;
    const w = chair.w * 0.44, zb = -chair.d * 0.5 + 0.2, yt = chair.h + 0.25;
    // a long dark overcoat thrown over the back: down the front to the seat, over the top rail, down the back nearly to the floor, in deep folds
    const prof = [[zb + 1.7, yt - 6.6], [zb + 1.4, yt - 5.0], [zb + 1.15, yt - 3.2], [zb + 0.95, yt - 1.5], [zb + 0.75, yt - 0.35], [zb + 0.3, yt + 0.05], [zb - 0.3, yt - 0.1], [zb - 0.75, yt - 1.0], [zb - 0.95, yt - 2.6],
      [zb - 1.05, yt - 4.4], [zb - 1.2, yt - 6.2], [zb - 1.45, yt - 7.9], [zb - 1.8, yt - 9.3]];
    const cols = 14, nj = prof.length, top = 5;
    const P = (i, j) => { const t = i / cols * 2 - 1, p = prof[j], hang = Math.abs(j - top) / (nj - 1 - top), amp = 0.06 + 0.5 * hang * hang, back = j > top ? -1 : 1;
      const fold = Math.sin(i * 1.75 + 0.6 * Math.sin(j * 0.7)) + 0.4 * Math.sin(i * 3.1 + j * 0.5);
      return [t * w * (1 + 0.16 * hang) + 0.12 * amp * Math.cos(i * 1.75), p[1] - 0.35 * t * t * (1 - hang) + 0.25 * amp * Math.sin(i * 0.9 + j), p[0] + back * amp * (0.7 + 0.7 * fold)]; };
    const shade = (i, j) => { const hang = Math.abs(j - top) / (nj - 1 - top); return 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(i * 1.75 + 0.6 * Math.sin(j * 0.7))) * (0.4 + 0.6 * hang) + 0.38 * (1 - hang) * 0.6; };
    for (let j = 0; j < nj - 1; j++) for (let i = 0; i < cols; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      const ny = prof[j + 1][0] - prof[j][0], nz = -(prof[j + 1][1] - prof[j][1]), l = Math.hypot(ny, nz) || 1, ref = [0, -ny / l, -nz / l];
      const e1 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], e2 = [d[0] - b[0], d[1] - b[1], d[2] - b[2]];
      let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]; const nl = Math.hypot(n[0], n[1], n[2]) || 1;
      n = n.map((v) => v / nl); if (n[0] * ref[0] + n[1] * ref[1] + n[2] * ref[2] < 0) n = n.map((v) => -v);
      G.set(3, C.coat, shade(i + 0.5, j + 0.5)); G.poly([a, b, c, d], n);
    }
    // sleeves hanging at either side, a cuff on each; each begins in a rounded shoulder (three rings on the sleeve's own line above its first), so its upper end is no open cut
    for (const sd of [-1, 1]) { G.set(3, C.coat, 0.85);
      const s0 = [sd * w * 0.98, yt - 0.5, zb - 0.5], s1 = [sd * w * 1.12, yt - 2.6, zb - 1.1], sl = Math.hypot(s1[0] - s0[0], s1[1] - s0[1], s1[2] - s0[2]), up = (m) => s0.map((v, a) => v - (s1[a] - v) / sl * m);
      G.tube([up(0.5), up(0.42), up(0.22), s0, s1, [sd * w * 1.1, yt - 5.0, zb - 1.25], [sd * w * 1.02, yt - 7.4, zb - 1.1]], (t) => { const k = Math.round(t * 6); return k < 3 ? [0.06, 0.36, 0.62][k] : 0.7 - 0.22 * (k - 3) / 3; }, 7, { u0: -0.5 });
      G.set(3, C.coat, 1.5); G.push().move(sd * w * 1.02, yt - 7.3, zb - 1.1); G.lathe([[0.52, -0.5], [0.56, 0.1], [0.5, 0.2]], 8); G.pop(); }
    // a paler collar rolled over the chair's top rail, a half belt with two brass buttons across the back
    G.set(3, C.coat, 2.4); G.tube([[-w * 0.8, yt + 0.12, zb + 0.5], [0, yt + 0.4, zb + 0.3], [w * 0.8, yt + 0.12, zb + 0.5]], 0.42, 6);
    G.push().move(0, yt - 4.0, zb - 1.32); G.box(w * 0.5, 0.26, 0.08, 0.03); G.pop();
    G.set(1, C.brassV); for (const s of [-1, 1]) { G.push().move(s * w * 0.42, yt - 4.0, zb - 1.42).rotX(Math.PI / 2); G.lathe([[0.01, 0], [0.2, 0.02], [0.2, 0.08], [0.01, 0.12]], 8); G.pop(); }
    G.pop();
  }
  return feet;
}

// one moth, 1.7 m across at size 1: broad forewings over rounded hindwings (a filled delta, not four blades), a furred spindle of a
// body, two feathered antennae. aW = (side, weight toward the tip, part: 0 body, 1 forewing, 2 hindwing); uv = (root to tip, trailing to leading edge)
function mothGeometry(plume) {
  const P = [], W = [], U = [], I = [];
  const fan = (pts, side, part) => {
    const b = P.length / 3;
    for (const p of pts) { P.push(side * p[0], 0.02 * (part === 2 ? -1 : 1) + 0.05 * p[0] * p[0], p[1]); W.push(side, Math.min(1, p[0] / 0.8), part); U.push(p[0] / 0.86, p[1] * 1.6 + 0.5); }
    for (let k = 1; k < pts.length - 1; k++) I.push(b, b + k, b + k + 1);
  };
  const fore = plume ? [[0.05, 0.14], [0.3, 0.27], [0.6, 0.35], [0.82, 0.34], [0.9, 0.27], [0.84, 0.12], [0.7, -0.02], [0.5, -0.1], [0.3, -0.12], [0.05, -0.08]]
    : [[0.05, 0.16], [0.3, 0.3], [0.58, 0.36], [0.78, 0.33], [0.86, 0.26], [0.84, 0.14], [0.74, 0.0], [0.6, -0.1], [0.34, -0.14], [0.05, -0.08]];
  const hind = plume ? [[0.05, -0.02], [0.3, -0.07], [0.52, -0.12], [0.62, -0.24], [0.6, -0.4], [0.5, -0.56], [0.36, -0.66], [0.2, -0.56], [0.05, -0.32]]
    : [[0.05, -0.02], [0.32, -0.08], [0.56, -0.14], [0.68, -0.26], [0.66, -0.42], [0.52, -0.54], [0.32, -0.58], [0.14, -0.5], [0.05, -0.34]];
  for (const s of [-1, 1]) { fan(hind, s, 2); fan(fore, s, 1); }
  const bw = plume ? 0.85 : 1, rings = [[0.42, 0.0], [0.38, 0.07], [0.24, 0.14], [0.04, 0.13], [-0.25, 0.105], [-0.5, 0.06], [-0.64, 0.0]], NS = 8, b0 = P.length / 3;
  for (let j = 0; j < rings.length; j++) for (let k = 0; k <= NS; k++) {
    const a = k / NS * Math.PI * 2, r = rings[j][1] * bw;
    P.push(Math.sin(a) * r, -Math.cos(a) * r * 0.9 + 0.01, rings[j][0]); W.push(0, 0, 0); U.push(0.5 - rings[j][0], k / NS);
  }
  for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < NS; k++) { const a = b0 + j * (NS + 1) + k, c = a + NS + 1; I.push(a, c, a + 1, a + 1, c, c + 1); }
  for (const sd of [-1, 1]) {
    const b = P.length / 3, w = plume ? 0.05 : 0.06;
    for (const q of [[0.04, 0.38, -w], [0.04, 0.38, w], [0.22, 0.66, w * 0.5], [0.19, 0.69, -w * 0.5]]) { P.push(sd * (q[0] + q[2] * 0.8), 0.05 + (q[1] - 0.38) * 0.35, q[1] - q[2] * 0.5); W.push(0, 0, 0); U.push(0.3, 0.5); }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(W, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); return g;
}

// charts, logbook and dial: sheets lying on the desk (desk-top-local), tessellated so a corner can lift
function paperGeometry(sheets) {
  const P = [], U = [], K = [], I = [];
  for (const s of sheets) {
    const n = s.n ?? 1, b = P.length / 3, c = Math.cos(s.rot || 0), sn = Math.sin(s.rot || 0);
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const u = i / n, v = j / n, x = (u - 0.5) * s.w, z = (v - 0.5) * s.d;
      P.push(s.x + c * x + sn * z, s.y, s.z - sn * x + c * z); U.push(u, 1 - v);
      const cu = s.corner ? (s.corner[0] > 0 ? u : 1 - u) : 0, cv = s.corner ? (s.corner[1] > 0 ? v : 1 - v) : 0;
      K.push(s.kind, s.corner ? Math.max(0, (cu + cv - 1.15) / 0.85) : 0);
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = b + j * (n + 1) + i, d = a + n + 1; I.push(a, d, a + 1, a + 1, d, d + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2));
  g.setIndex(I); return g;
}

export default {
  id: 'great-refractor',
  name: 'The Dome Opens',
  category: 'interior',
  weirdness: 0.1,
  media: ['air', 'tiny', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, density = vary.density ?? 1;
    const tick = () => ctx.yield();
    // ---- which night is it
    const seed = (ctx.seed >>> 0);
    let li = (seed * 7 + (seed >>> 2)) % 4; if (vary.hour === 'dawn') li = 3;
    const L = LOOKS[li], rare = !!vary.rare;
    const cast = rng.fork('cast'), plume = cast.chance(0.45), nLampMoths = Math.max(10, Math.round(18 * density)), mothPhase = cast.range(0, TAU);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(L.bg);
    scene.fog = new THREE.FogExp2(L.fog, L.fogD);

    // ---- the hero: dome, telescope, pier, driving clock, rising deck
    // the entry axis: in from the north-east over the desk, aimed past the pier's west face. The dome starts turned so far west that
    // the first blade of stars stands exactly where that axis meets the far wall, and it rumbles round to the south from there.
    const ENTRY = [62.8, 20, -130.4], EDIR = [-0.776, 0.63];
    const domeTurn0 = (() => { const b = ENTRY[0] * EDIR[0] + ENTRY[2] * EDIR[1], c = ENTRY[0] * ENTRY[0] + ENTRY[2] * ENTRY[2] - 157 * 157, t = -b + Math.sqrt(b * b - c);
      return Math.atan2(ENTRY[0] + EDIR[0] * t, ENTRY[2] + EDIR[1] * t) * 180 / Math.PI; })();
    const hero = await buildHero(ctx, { palette: PALETTE, star: L.starHi, starLow: L.starLo, frost: L.frost, beam: 0.002, lampGain: L.rubyGain, clockAt: [0.11, 0.17], portalRadius: 6, track: 0, cloud: L.cloud ? 0.9 : 0, creep: 2.5, creepRate: 0.17, creepEarly: 1.5, flicker: 0.3, deckKey: L.deckKey,
      fill: L.fill, deckColor: DECK, domeTurn: domeTurn0, domeEase: 'cubic', fittings: 'brass' });
    hero.setStarColor(L.star, L.dome ?? L.star); hero.setLampGlow(L.ruby, L.rubyGain);
    const HU = hero.lit.uniforms, SLITW = HU.uSlit.value.x;
    HU.uDomeL.value.x = L.domeL[0]; HU.uDomeL.value.y = L.domeL[1];      // the dome's own share of the slit's light: a floor all round the hull, and the gain beside the opening
    hero.setAmbientShare(L.amb[0], L.amb[1] * 1.45, L.amb[2], L.amb[3]);
    HU.uAmbSky.value.set(L.ambSky[0], L.ambSky[1], L.ambSky[2]); HU.uAmbGnd.value.set(L.ambGnd[0], L.ambGnd[1], L.ambGnd[2]);
    scene.add(hero.object);
    const A = hero.anchors, deck = hero.floorGroup, heroMat = hero.object.getObjectByName('machine').material;
    await tick();

    // ---- the route: in from the north-east over the desk, across to the clock on the pier's west face, back to the west wall for
    // the whole machine, along the rail toward the slit's foot, north again past the pier, round behind the tail and up the axis
    const ax = A.axis, piv = A.pivot, onAxis = (s) => [piv.x + ax.x * s, piv.y + ax.y * s, piv.z + ax.z * s];
    const seat = A.portalSeat.position;
    // (the first 96 m run nearly level along the entry axis; the globe and the chart table stand to its left, the desk dead ahead)
    const eAt = (t, y, r = 0) => [ENTRY[0] + EDIR[0] * t - 0.63 * r, y, ENTRY[2] + EDIR[1] * t - 0.776 * r];
    const offAxis = (sx, a, b) => [piv.x + ax.x * sx + a, piv.y + ax.y * sx + ax.z * b, piv.z + ax.z * sx - ax.y * b];      // a point a metres east of the axis and b above it
    const path = makePath([ENTRY, eAt(24, 20), eAt(50, 20.5), eAt(76, 22), eAt(96, 26.5), [-24, 33, -60], [-44, 46, -66], [-54, 58, -58], [-52, 65, -46], [-56, 68, -20], [-62, 72, 0],
      [-80, 82, 10], [-104, 97, 8], [-126, 103, -14], [-130, 102, -45], [-116, 97, -73], [-66, 142, -18], [-50, 172, 14], [-28, 192, 34], [0, 206, 22], [32, 178, 6],
      [58, 134, -10], [74, 98, -30], [74, 80, -62], [50, 70, -94], [15, 62, -109], [0, 61.5, -97], onAxis(-115), onAxis(-91), offAxis(-55, 2.4, -1.2), offAxis(-15, 3.2, -1.0), offAxis(30, 1.5, 0), onAxis(70), [seat.x, seat.y, seat.z]]);
    const PL = path.length;

    // ---- colours for everything built here (linear)
    const col = (r, g, b) => new THREE.Color(r, g, b);
    const C = { brick: col(0.36, 0.28, 0.27), flag: col(0.3, 0.31, 0.34), deck: new THREE.Color(DECK), iron: col(0.2, 0.25, 0.34), ironDark: col(0.085, 0.1, 0.14),
      stone: col(0.44, 0.47, 0.52), shutter: col(0.2, 0.29, 0.42), brassV: col(0.46, 0.46, 0.46), steel: col(0.42, 0.45, 0.5), black: col(0.02, 0.022, 0.03), rope: new THREE.Color('#8f8468').multiplyScalar(0.6),
      wood: col(0.3, 0.21, 0.14), coat: col(0.036, 0.04, 0.06), sconce: col(0.78, 0.075, 0.04), rubyGlass: new THREE.Color(PALETTE[4]), paper: col(0.52, 0.53, 0.5), navy: col(0.028, 0.05, 0.14),
      globe: col(0.035, 0.05, 0.1), bookRed: col(0.26, 0.03, 0.045), bookGreen: col(0.03, 0.13, 0.08), rail: col(0.56, 0.35, 0.09) };
    const { Geo } = hero.lit;
    const addMesh = (parent, geo, mat, name, order) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; if (order != null) m.renderOrder = order; parent.add(m); return m; };
    {
      const G = new Geo(48000);
      await buildDrum(ctx, hero, C, G);
      await tick(); const geo = G.build(); await tick();
      addMesh(scene, geo, heroMat, 'drum');
    }
    await tick();

    // ---- the desk: kit furniture at 12 times life size on its own small rig (one green lamp, no sun), riding the deck
    // it stands square across the entry axis 110 m in, north-west of where the tail will come down, lamp at its south-east end: the
    // green pool is dead ahead from the door, under us at u 0.12, and below the eyepiece in the views of the tail
    const DX = -24, DZ = -66, S = 12, TOP = 9, DROT = Math.atan2(EDIR[0], EDIR[1]), DC = Math.cos(DROT), DS = Math.sin(DROT);
    const d2w = (x, z) => [DX + x * DC + z * DS, DZ - x * DS + z * DC];          // desk-local to deck-local
    const deskG = new THREE.Group(); deskG.name = 'desk'; deskG.position.set(DX, 0, DZ); deskG.rotation.y = DROT; deck.add(deskG);
    const rig = INT.makeLightRig({ scale: S, sunIntensity: 0, ambient: 2.6, ambientSky: L.kitSky, ambientGround: L.kitGnd, bounce: 0, fill: 0, aoStrength: 0.7 });
    const chairAt = { x: -9.5, z: -9.8, ry: 0.4 }, lampAt = [8.5, TOP, 3.4], cupAt = [-12.4, TOP, 3.5];
    await tick();
    const fur = INT.makeFurniture({ rig, rng: rng.fork('desk'), scale: S, sway: { amp: 0.035, freq: 1.6 }, items: [
      { kind: 'table', position: [0, 0, 0], opts: { width: 2.5, depth: 1.0, height: TOP / S, legs: 'turned', color: '#6b4a35' } },
      { kind: 'lamp', position: lampAt, rotation: Math.PI, opts: { kind: 'desk', shadeColor: '#1c8a50', glow: 0.8 }, light: { color: '#46d68c', intensity: 15, range: 70 } },
    ] });
    deskG.add(fur.object);
    await tick();
    const fur1 = INT.makeFurniture({ rig, rng: rng.fork('desk1'), scale: S, items: [
      { kind: 'chair', position: [chairAt.x, 0, chairAt.z], rotation: chairAt.ry, opts: { style: 'arm', color: '#5a4334', seatColor: '#3f6a56' } },
    ] });
    deskG.add(fur1.object);
    await tick();
    const fur2 = INT.makeFurniture({ rig, rng: rng.fork('desk2'), scale: S, sway: { amp: 0.035, freq: 1.6 }, items: [
      { kind: 'cup', position: cupAt, opts: { color: '#dfe6ea', tea: '#2a1a12' } },
      { kind: 'bookStack', position: [12.6, TOP, -1.6], rotation: -0.3, opts: { count: 4 } },
      { kind: 'bookStack', position: [12.4, TOP, 3.6], rotation: 0.5, opts: { count: 2 } },
    ] });
    deskG.add(fur2.object);
    await tick();
    const fur3 = INT.makeFurniture({ rig, rng: rng.fork('desk3'), scale: S, sway: { amp: 0.035, freq: 1.6 }, items: [
      { kind: 'plant', position: [-13, TOP, -3.0], opts: { kind: 'fern', height: 0.52, potColor: '#6d7f95' } },
    ] });
    deskG.add(fur3.object);
    await tick();
    const chairItem = fur1.items.find((it) => it.kind === 'chair'), lampItem = fur.items.find((it) => it.kind === 'lamp');
    const lampLocal = new THREE.Vector3(lampAt[0], TOP + (lampItem?.size?.[1] ?? 4.8) * 0.78, lampAt[2] - 0.8);       // the bulb, desk-local
    const lampBase = new THREE.Vector3(d2w(lampLocal.x, lampLocal.z)[0], lampLocal.y, d2w(lampLocal.x, lampLocal.z)[1]);   // deck-local = world at floor 0
    const sheets = [
      { kind: 1, x: 4.2, y: TOP + 0.03, z: -0.6, w: 10.5, d: 8.6, rot: 0.16, n: 8, corner: [1, -1] },
      { kind: 0, x: -2.6, y: TOP + 0.06, z: -0.2, w: 11.6, d: 10.6, rot: -0.1, n: 10, corner: [-1, -1] },
      { kind: 2, x: -9.6, y: TOP + 0.5, z: -1.2, w: 5.2, d: 3.6, rot: -0.12, n: 1 },
      { kind: 3, x: -9.2, y: TOP + 1.53, z: 3.4, w: 3.3, d: 3.3, rot: 0.3, n: 1 },
    ];
    const paperU = { uTime: { value: 0 }, uLamp: { value: new THREE.Vector4(0, 0, 0, 46) }, uLampCol: { value: new THREE.Color('#46d68c').multiplyScalar(3.4) },
      uAmb: { value: new THREE.Vector3(L.ambSky[0], L.ambSky[1], L.ambSky[2]).multiplyScalar(0.5) }, uHand: { value: 0 } };
    const paperMat = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...paperU }, vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, fog: true, side: THREE.DoubleSide });
    addMesh(deskG, paperGeometry(sheets), paperMat, 'papers');
    // the logbook's cover under its pages, the pencil that rolls
    const pencil = new THREE.Group(); pencil.position.set(-4.2, TOP + 0.2, -3.4); pencil.rotation.y = -0.5; deskG.add(pencil);
    let deckX = null;
    await tick();
    {
      const G = new Geo(12000);
      const feet = buildDeckSet(hero, C, G, { x: DX, z: DZ, rot: DROT, top: TOP, half: [S * 2.5 / 2, S * 1.0 / 2], weights: [[9.0, 3.2], [-0.4, -4.9], [2.4, 4.3], [-7.6, 4.6], [3.0, -4.6]], chrono: [-9.2, 3.4] },
        chairItem ? { x: d2w(chairAt.x, chairAt.z)[0], z: d2w(chairAt.x, chairAt.z)[1], ry: chairAt.ry + DROT, w: chairItem.size[0], d: chairItem.size[2], h: chairItem.size[1] } : null);
      await tick();
      G.set(3, col(0.1, 0.13, 0.2)); G.push().move(d2w(-9.6, -1.2)[0], TOP + 0.24, d2w(-9.6, -1.2)[1]).rotY(DROT - 0.12); G.box(2.75, 0.24, 1.95, 0.08); G.pop();
      await tick();
      deckX = buildDeckExtras(C, G, [d2w(-1.5, -3)[0], d2w(-1.5, -3)[1], DROT + Math.PI / 2]);
      // contact shadows: every thing's footprint goes to the floor's shader once, here (deck-local is the floor's own x and z; the
      // things rise with the boards, so the list never changes)
      { const all = feet.concat(deckX.feet).slice(0, HU.uFootA.value.length);
        all.forEach((f, i) => { HU.uFootA.value[i].set(f[0], f[1], Math.cos(f[4]), Math.sin(f[4])); HU.uFootB.value[i].set(f[2], f[3], f[6], Math.min(0.85, f[5] * 1.5)); });      // (one gain over the listed strengths)
        HU.uFootN.value = all.length; }
      await tick();
      addMesh(deck, G.build(), heroMat, 'deck-set');
      const P = new Geo(300); P.set(3, col(0.5, 0.36, 0.1)); P.push().rotZ(Math.PI / 2); P.lathe([[0.01, -2.2], [0.13, -1.8], [0.13, 1.9], [0.01, 1.9]], 6); P.set(4, C.black); P.lathe([[0.02, -2.25], [0.05, -2.1], [0.01, -2.1]], 5); P.pop();
      addMesh(pencil, P.build(), heroMat, 'pencil');
    }
    await tick();

    // ---- the sky in the slit: a strip just outside the shutters that turns with the dome and shows the sky at infinity
    const skyU = { uRot: { value: new THREE.Matrix3() }, uTime: { value: 0 }, uLook: { value: new THREE.Vector4(L.mw, L.lmc, L.cloud, L.dawn) },
      uLook2: { value: new THREE.Vector4(L.comet, L.vap, 1, L.core) }, uMetA: { value: new THREE.Vector3(0, 1, 0) }, uMetB: { value: new THREE.Vector3(0, 1, 0.01) },
      uMet: { value: new THREE.Vector4(0, 0, 0, 1) }, uMoon: { value: new THREE.Vector3(0.5, 0.7, 0.42).normalize() }, uMet2: { value: new THREE.Vector2(2, 0) }, uSwing: { value: new THREE.Vector2(0, 0) } };
    {
      const Rs = 163.6, a0 = -0.06, a1 = Math.PI / 2 + Math.asin(33 / 160) + 0.06, rows = 30, cols = 8, half = SLITW + 9, P = [], I = [];
      for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { const x = -half + 2 * half * i / cols, a = a0 + (a1 - a0) * j / rows, rho = Math.sqrt(Rs * Rs - x * x); P.push(x, rho * Math.sin(a), rho * Math.cos(a)); }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j * (cols + 1) + i, d = a + cols + 1; I.push(a, a + 1, d, a + 1, d + 1, d); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      addMesh(hero.domeGroup, g, new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.DoubleSide, fog: false }), 'sky-in-slit', 2);
    }
    // the sky is kept standing in the slit: the Large Cloud on one point of the opening as the route sees it, the Milky Way
    // lying along the slit. [u, metres across the slit (west negative), degrees up it from the south foot]
    const SKYK = [[0, 0, 14], [0.08, 0, 32], [0.14, 0, 40], [0.24, 0, 45], [0.6, 0, 48], [0.75, -8, 34], [1, -8, 34]];
    const skyKey = (u, c) => { let i = 0; while (i < SKYK.length - 2 && u > SKYK[i + 1][0]) i++; const a = SKYK[i], b = SKYK[i + 1]; return a[c] + (b[c] - a[c]) * sstep(a[0], b[0], u); };
    const SKL = new THREE.Vector3(0.213, 0.793, 0.57).normalize(), SKT = new THREE.Vector3().crossVectors(SKL, new THREE.Vector3(0.963, -0.114, -0.245)).normalize(), SKB = new THREE.Vector3().crossVectors(SKL, SKT);
    const metCol = new THREE.Color(L.star), fireCol = new THREE.Color(0.08, 1.0, 0.24).multiplyScalar(2.3), DEG = Math.PI / 180, RS = 163.6;
    await tick();

    // ---- moths: a dozen round the green lamp, two of which come with us; later a pale cloud of them over the starlit tube, and
    // two ahead of us inside it for scale
    const lanternAt = [];      // every ruby lantern that rides the deck has a moth or two of its own (deck-local)
    const offPath = (v) => path.distanceTo(v.x, v.y, v.z) > 16 && path.distanceTo(v.x, v.y + 50, v.z) > 16;      // (not where we fly right over one: its moths would fill the frame's edge)
    for (const l of A.lamps) if (l.ridesFloor && offPath(l.position)) lanternAt.push(l.position);
    for (const l of deckX.lamps) { const v = new THREE.Vector3(l[0], l[1], l[2]); if (offPath(v)) lanternAt.push(v); }
    const nTubeMoths = 26, NCOMP = 6, NIN = 2, TM0 = nLampMoths + 2, IN0 = TM0 + nTubeMoths, LM0 = IN0 + NIN, NM = LM0 + lanternAt.length * 2, NRISE = 7;
    const mothU = { uFlap: { value: plume ? 15 : 11 }, uColA: { value: plume ? col(0.5, 0.47, 0.38) : col(0.52, 0.47, 0.38) }, uColB: { value: plume ? col(0.2, 0.2, 0.24) : col(0.17, 0.14, 0.12) },
      uColC: { value: plume ? col(0.3, 0.4, 0.52) : col(0.55, 0.26, 0.27) }, uPlume: { value: plume ? 1 : 0 } };
    const mothGeo = mothGeometry(plume);
    { const ph = new Float32Array(NM + NRISE), tone = new Float32Array(NM + NRISE); for (let i = 0; i < NM; i++) { ph[i] = cast(); tone[i] = 0.9 + 0.25 * ((i * 7) % 5) / 4; }
      for (let i = NM; i < NM + NRISE; i++) { ph[i] = (i * 0.618034) % 1; tone[i] = 2.6; }
      mothGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 1)); mothGeo.setAttribute('aTone', new THREE.InstancedBufferAttribute(tone, 1)); }
    const moths = new THREE.InstancedMesh(mothGeo, new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...HU, ...mothU }, vertexShader: MOTH_VERT, fragmentShader: mothFrag(hero.lit.lightGLSL), defines: { BEAM_STEPS: 4 }, fog: true, side: THREE.DoubleSide }), NM + NRISE);
    moths.name = 'moths'; moths.frustumCulled = false; scene.add(moths);
    const mothP = []; for (let i = 0; i < NM; i++) mothP.push({ r: cast.range(3.6, 10.5), w: cast.range(0.5, 1.1) * (cast.chance(0.5) ? 1 : -1), a: cast.range(0, TAU), h: cast.range(-1.8, 4.6), wob: cast.range(0.6, 1.6), size: cast.range(0.85, 1.1) });
    // hawk moths are a metre and a half across (the brief): the dozen at the lamp keep close to it, the two that come with us fly well ahead
    for (let i = 2; i < TM0; i++) { const p = mothP[i], wide = (i % 3) === 0; p.r = wide ? 6 + 0.7 * p.r : 2.6 + 0.3 * p.r; p.h = wide ? 0.6 + 1.0 * Math.abs(p.h) : p.h * 0.6; p.size *= (wide ? 1.3 : 1.1) * (0.74 + 0.13 * ((i * 3) % 5)); if (wide) p.w *= 0.55; }
    mothP[0].size = 1.15; mothP[1].size = 1.1;
    for (let i = TM0; i < IN0; i++) { const p = mothP[i]; p.s = -86 + 84 * (i - TM0 + cast()) / nTubeMoths; p.r = cast.range(14.5, 19); p.w *= 0.6; p.a = cast.range(-1.0, 1.0); p.size *= 1.15; if (i < TM0 + NCOMP) { p.a = cast.range(-0.75, 0.25); p.size *= 0.9; } }
    for (let i = IN0; i < LM0; i++) mothP[i].size *= 1.45;
    for (let i = LM0; i < NM; i++) { const p = mothP[i]; p.r = 1.6 + 0.22 * p.r; p.h = 0.4 * p.h; p.size *= 0.95; }

    // ---- dust in the starlight, halos on the lamps, steam off the cup
    const time = { value: 0 };
    const nDust = Math.round(5000 * detail * density);
    const dustU = { ...HU, uBox: { value: new THREE.Vector3(96, 64, 96) }, uSizeK: { value: 0.0028 }, uDustGain: { value: 1.7 },
      uPiv: { value: piv.clone() }, uAx: { value: ax.clone() }, uE1: { value: new THREE.Vector3(1, 0, 0) }, uE2: { value: new THREE.Vector3(0, ax.z, -ax.y) } };
    {
      const dr = rng.fork('dust'), quad = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
      for (const [n, tube] of [[nDust, false], [Math.round(2400 * detail), true]]) {
        const g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
        g.setAttribute('position', new THREE.Float32BufferAttribute(quad, 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
        const sd = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) sd[i] = dr();
        g.setAttribute('aS', new THREE.InstancedBufferAttribute(sd, 4));
        addMesh(scene, g, new THREE.ShaderMaterial({ uniforms: dustU, vertexShader: dustVert(hero.lit.lightGLSL), fragmentShader: DUST_FRAG, defines: tube ? { TUBE: '' } : {},
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), tube ? 'tube-dust' : 'dust', 6);
      }
    }
    // dust in the bar of starlight round the upper tube: seeded on a stream of its own (made from the seed, not forked from the
    // world's, so no draw of the world's moves)
    const xr = makeRng(hashSeed('great-refractor:starlit:' + seed));
    {
      const n = Math.round(2400 * detail), g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const sd = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) sd[i] = xr();
      g.setAttribute('aS', new THREE.InstancedBufferAttribute(sd, 4));
      addMesh(scene, g, new THREE.ShaderMaterial({ uniforms: dustU, vertexShader: dustVert(hero.lit.lightGLSL), fragmentShader: DUST_FRAG, defines: { BAR: '' },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), 'bar-dust', 6);
    }
    await tick();
    const lampGlow = [], gpos = [], gcol = [], gsz = [];
    for (const l of A.lamps) { lampGlow.push({ base: l.position.clone(), rides: l.ridesFloor }); gpos.push(l.position.clone()); gcol.push(new THREE.Color(PALETTE[4]).multiplyScalar(0.25 + 0.75 * L.ruby)); gsz.push(l.ridesFloor ? 1 : 0.8); }
    lampGlow.push({ base: lampBase.clone(), rides: true }); gpos.push(lampBase.clone()); gcol.push(new THREE.Color('#46d68c')); gsz.push(1.7);
    for (const l of deckX.lamps) { const b = new THREE.Vector3(l[0], l[1], l[2]); lampGlow.push({ base: b, rides: true }); gpos.push(b.clone()); gcol.push(new THREE.Color(PALETTE[4]).multiplyScalar(0.25 + 0.75 * L.ruby)); gsz.push(0.9); }
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU, b = new THREE.Vector3(Math.sin(a) * 156.9, 57.6, Math.cos(a) * 156.9); lampGlow.push({ base: b, rides: false }); gpos.push(b); gcol.push(new THREE.Color(1.0, 0.16, 0.07).multiplyScalar(0.3 + 0.7 * L.ruby)); gsz.push(1.0); }
    const glows = fx.makeGlows({ rng: rng.fork('glows'), positions: gpos, colors: gcol, sizes: gsz, size: 5.5, intensity: 0.8, time, flicker: 0.25, halo: 1, core: 0.6, fogAmount: 0.6 });
    scene.add(glows.object);
    // two streams of their own, made from the visit's seed and a name (they draw nothing from any other stream): the phases of the
    // sky's swing, and the moths that climb the bar of starlight
    { const sw = makeRng(hashSeed('great-refractor:sky-swing:' + seed)); skyU.uSwing.value.set(sw.range(0, TAU), sw.range(0, TAU)); }
    // Seven hawk moths, a metre and a half across (the geometry is 1.7 m at size 1), share one long climb from the saddle up beside
    // the tube and out past the dew cap to the slit; they are spread evenly along it from a seeded start, so at every clock four
    // or so are beside the upper tube and one is out against the stars. All seven keep to the tube's FAR side, the side our own flight
    // leaves by, BY PLACE: our route comes over the tube's back inside the lane the two-sided climb used (u 0.50 to 0.52), and a
    // climber met the lens there on some clocks of entry. Its dealt angle (the same draw, 0.35 to 1.25) is laid into 0.8 to 1.3 rad on
    // that one side, so with its 0.3 rad of wander a climber lives between 0.5 and 1.6 rad and its lane keeps 2.7 m of clear air from
    // the whole line we fly, at every phase of the climb. Nothing reads the lens; no draw is added, removed or reordered.
    // The lane keeps 2.0 m of clear air, wing tip to metal, from the skin, the cell's bolt heads and the dew cap: a climber lives 16.7 to 18.6 m from the
    // axis and is drawn in toward it only past the cap's mouth (from 124 m); it is gone 153.2 m from the dome's centre, short of its timber (the cross beam past the crown stands in to 155.2 m).
    const RISE_T = 44, riseP = [], tubeNow = heroMat.uniforms.uBone.value[2];
    { const rr = makeRng(hashSeed('great-refractor:risers:' + seed)), ph0 = rr();
      for (let j = 0; j < NRISE; j++) riseP.push({ ph: ph0 + (j + 0.5 * rr()) / NRISE, a: 0.8 + (rr.range(0.35, 1.25) - 0.35) * (0.5 / 0.9), w: rr.range(0.5, 1.0), wob: rr.range(0.7, 1.5), r: 17.45 + (rr.range(15.4, 17.6) - 15.4) * (0.4 / 2.2), size: rr.range(0.85, 0.92) }); }
    const steamU = { uTime: { value: 0 }, uBase: { value: new THREE.Vector3() }, uSize: { value: 0.9 }, uCol: { value: col(0.1, 0.13, 0.17) } };
    {
      const n = 14, g = new THREE.InstancedBufferGeometry(); g.instanceCount = n;
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const s = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) s[i] = cast(); g.setAttribute('aS', new THREE.InstancedBufferAttribute(s, 3));
      addMesh(scene, g, new THREE.ShaderMaterial({ uniforms: steamU, vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }), 'steam', 5);
    }
    await tick();

    // ---- per-frame state (nothing is created after this point)
    const V3 = THREE.Vector3, up = new V3(0, 1, 0);
    const lampW = new V3().copy(lampBase), orb = new V3(), lp = new V3(), tg = new V3(), left = new V3(), fwd = new V3(), bx = new V3(), by = new V3(), bz = new V3(), pos = new V3();
    const m4 = new THREE.Matrix4(), scl = new V3(), bufSize = new THREE.Vector2(), renderer = ctx.renderer;
    const gz = new V3(0, 0, 1), gr = new V3(1, 0, 0), gu = new V3(0, 1, 0), cf = new V3(), sv0 = new V3(), sv1 = new V3(), sv2 = new V3(), sA = new V3(), sB = new V3(), pp = new V3();
    let gazeSet = false, cdm = 1, sdm = 0;
    // the direction from the route (pp) to a point of the slit: x metres across it, a radians up it from the south foot
    const slitDir = (x, a, out) => { const rho = Math.sqrt(RS * RS - x * x), ly = rho * Math.sin(a), lz = rho * Math.cos(a); return out.set(x * cdm + lz * sdm - pp.x, piv.y + ly - pp.y, -x * sdm + lz * cdm - pp.z).normalize(); };
    hero.setLamp(7, lampW, '#46d68c', 76, 6.4);
    // the four lanterns among the astronomers' things take the rig's free lamp slots; the wall sconces and the warm glint in polished metal
    const xLamps = deckX.lamps.slice(0, 4), xSlot = [];
    for (let i = 0; i < xLamps.length; i++) { hero.setLamp(3 + i, new THREE.Vector3(xLamps[i][0], xLamps[i][1], xLamps[i][2]), PALETTE[4], 34, L.rubyGain * 0.85, 0.3); xSlot.push(hero.state.userLamps[3 + i]); }
    HU.uRing.value.z = 54; HU.uRing2Col.value.set(1.0, 0.2, 0.09).multiplyScalar(L.sconce); HU.uRing2.value.z = 50;
    // the hall's own light: night-blue leaking round the shutters, lamp light thrown back up off the deck, starlight on every rib
    if (L.dawn) HU.uWinCol.value.set(0.16, 0.7, 0.66).multiplyScalar(0.6); else if (L.cloud) HU.uWinCol.value.set(0.56, 0.68, 1.0).multiplyScalar(1.7); else HU.uWinCol.value.set(0.2, 0.4, 1.0).multiplyScalar(0.8 + 0.5 * L.frost);
    const winBase = HU.uWinCol.value.clone();
    HU.uBounce.value.set(1.0, 0.4, 0.22, 0).multiplyScalar(0.2 * (0.35 + 0.65 * L.ruby)); HU.uDomeK.value.y = 70; HU.uDomeK.value.z = 0.45; HU.uWarm.value.set(0.05, 0.026, 0.008).multiplyScalar(0.6 + 0.4 * L.ruby);
    HU.uDomeWarm.value.set(1.0, 0.36, 0.2).multiplyScalar(0.3 * (0.35 + 0.65 * L.ruby));      // the lamps' warmth on the dome's lowest boards, just above the rail
    { const le = hero.lens.uniforms; le.uLensLook.value.set(Math.max(L.mw, 0.6) + 0.5 * L.core, L.lmc, 0, L.dawn); le.uLensLook2.value.set(L.core, L.comet, 0, 0); }
    const pendPivot = new THREE.Vector3(deckX.pend[0], deckX.pend[1], deckX.pend[2]), pendAxis = new THREE.Vector3(Math.sin(-Math.PI / 2 - 0.3), 0, Math.cos(-Math.PI / 2 - 0.3)), pendBone = HU.uBone.value[19], pm1 = new THREE.Matrix4(), pm2 = new THREE.Matrix4();
    const cupW = d2w(cupAt[0], cupAt[2]), SHAFT = 0.3;
    const deskLamp = hero.state.userLamps[7];
    const pencilMesh = pencil.children[0];
    let lastFy = -1;
    const placeMoth = (i, p, f, size, roll) => {
      bz.copy(f).normalize(); bx.crossVectors(up, bz); if (bx.lengthSq() < 1e-6) bx.set(1, 0, 0); bx.normalize(); by.crossVectors(bz, bx);
      if (roll) { const c = Math.cos(roll), s = Math.sin(roll); tg.copy(bx).multiplyScalar(c).addScaledVector(by, s); by.multiplyScalar(c).addScaledVector(bx, -s); bx.copy(tg); }
      m4.makeBasis(bx, by, bz).scale(scl.setScalar(size)).setPosition(p); moths.setMatrixAt(i, m4);
    };
    const orbitOf = (i, t, out, outF) => {
      const p = mothP[i], a = p.a + mothPhase + t * p.w, r = p.r * (0.8 + 0.25 * Math.sin(t * p.wob + i));
      out.set(lampW.x + Math.cos(a) * r, lampW.y + p.h + 0.9 * Math.sin(t * p.wob * 1.7 + i * 2.1), lampW.z + Math.sin(a) * r);
      const sg = p.w > 0 ? 1 : -1; outF.set(-Math.sin(a) * sg, 0.3 * Math.cos(t * p.wob * 1.7 + i * 2.1), Math.cos(a) * sg);
    };

    // The lens. The engine sets the world's field of view (70 degrees) every frame before update(). On the swoop into the tail it
    // narrows to a long 32 degree lens, as if the telescope itself did the looking: the great lens at the far end is a fifth of the
    // frame from the tail on, the baffles stand stacked ring inside ring, and it opens again over the last metres (1 at u = 0, which
    // is also the value while this world is seen through a portal, and 1 at the exit, so the crossing is the engine's own).
    const LONG1 = Math.tan((58 * Math.PI) / 360) / Math.tan((70 * Math.PI) / 360), LONG2 = Math.tan((35 * Math.PI) / 360) / Math.tan((70 * Math.PI) / 360);
    const lensAt = (u) => 1 - (1 - LONG1) * sstep(0.75, 0.79, u) + (LONG2 - LONG1) * sstep(0.875, 0.945, u) + (1 - LONG2) * sstep(0.945, 0.997, u);
    function update(dt, t, camera, u) {
      time.value = t;
      const lensK = ctx.through ? 1 : lensAt(u);
      if (lensK < 0.999 && camera.isPerspectiveCamera) { camera.fov = (2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * lensK) * 180) / Math.PI; camera.updateProjectionMatrix(); }
      hero.setProgress(u);
      hero.setIris(1 - sstep(uIris0, uIris1, u));
      const swell = L.cloud ? 0.84 + 0.3 * Math.sin(t * 0.47) + 0.09 * Math.sin(t * 1.13 + 1.3) : 1;
      if (L.cloud) HU.uWinCol.value.copy(winBase).multiplyScalar(0.55 + 0.5 * swell);
      hero.setStar(swell);      // cloud crossing the slit: the light swells and fades
      hero.setFlash(rare ? 0.55 * bellU(0.3045, 0.3225, u) : 0);
      hero.update(dt, t, camera);
      camera.getWorldPosition(pos);
      { const da = hero.domeAngle(); cdm = Math.cos(da); sdm = Math.sin(da); }
      const camS = (pos.x - piv.x) * ax.x + (pos.y - piv.y) * ax.y + (pos.z - piv.z) * ax.z;
      {
        // the light in the air. The slab of starlight under the slit shows as haze only from outside it (inside, it would veil the
        // whole room); the round shaft down the tube's axis comes up for the long view and thins when we fly into it.
        const slabIn = (1 - sstep(0.6 * SLITW, SLITW + 34, Math.abs(cdm * pos.x - sdm * pos.z))) * sstep(0.36, 0.46, u);
        const dAx = Math.hypot(pos.x - piv.x - ax.x * camS, pos.y - piv.y - ax.y * camS, pos.z - piv.z - ax.z * camS);
        const clearK = sstep(18, 44, pos.x) * sstep(50, 66, pos.y);      // east of the instrument, all the way down its flank, the air between us and the tail is clear and the cold rim on the tube and the ladder comes up (a rule of place: the camera is east of the pier and above the desk only on that descent)
        hero.setBeam(0.003 * (1 - 0.82 * sstep(0.25, 0.9, hero.slitOpen())) * (1 - 0.5 * sstep(0.24, 0.3, u)) * (1 - 0.9 * slabIn) * (1 - 0.9 * clearK));
        hero.setRim(0.55 + 0.6 * clearK);
        HU.uShaft.value.x = SHAFT * sstep(0.2, 0.3, u) * (0.1 + 0.9 * sstep(13, 62, dAx)) * (1 - sstep(0.765, 0.8, u)) * (1 - 0.9 * clearK);
        HU.uSlitGlow.value = (0.4 + 1.3 * (1 - sstep(0.0, 0.05, u))) * (1 - sstep(0.02, 0.14, u));      // the blade's bar of light down the far wall: strongest in the first view
        { const e = 1 - sstep(0.1, 0.27, u), rl = 0;
          HU.uDomeK.value.x = L.domeK + 0.14 + 0.44 * e + 0.3 * rl; HU.uAmbK.value.y = L.amb[1] * 1.45 * (1 + 0.8 * e); HU.uAmbK.value.x = L.amb[0] * (1 + 0.8 * e); }      // before the slit opens the room keeps a little more of its own light
        skyU.uLook2.value.z = 1.25 + 2.2 * (1 - sstep(0.03, 0.18, u));      // the first blade of stars is the brightest thing in the dark room
      }
      const fy = hero.floorY();
      lampW.set(lampBase.x, lampBase.y + fy, lampBase.z); deskLamp.y = lampW.y; HU.uBounce.value.w = fy;
      for (let i = 0; i < xSlot.length; i++) xSlot[i].y = xLamps[i][1] + fy;
      pendBone.makeTranslation(pendPivot.x, pendPivot.y, pendPivot.z).multiply(pm1.makeRotationAxis(pendAxis, 0.075 * Math.sin(t * 2.6))).multiply(pm2.makeTranslation(-pendPivot.x, -pendPivot.y, -pendPivot.z));
      rig.update(t, deskG); fur.update(dt, t, camera); fur1.update(dt, t, camera); fur2.update(dt, t, camera); fur3.update(dt, t, camera);
      // desk life: chart corners, the chronometer's hand, the pencil, steam
      paperU.uTime.value = t; paperU.uLamp.value.set(lampW.x, lampW.y, lampW.z, 46);
      const sec = Math.floor(t), fr = t - sec; paperU.uHand.value = (sec + sstep(0, 0.12, fr)) * TAU / 60;
      const roll = 0.85 * Math.sin(t * 0.55) + 0.2 * Math.sin(t * 1.7);
      pencil.position.z = -3.4 + roll; pencilMesh.rotation.x = roll / 0.13;
      steamU.uTime.value = t; steamU.uBase.value.set(cupW[0], TOP + 1.0 + fy, cupW[1]);
      // lamp halos ride the deck
      if (Math.abs(fy - lastFy) > 1e-3) { lastFy = fy; for (let i = 0; i < lampGlow.length; i++) { const g = lampGlow[i]; if (g.rides) glows.setPosition(i, g.base.x, g.base.y + fy, g.base.z); } }
      glows.update(dt, t); renderer.getDrawingBufferSize(bufSize); dustU.uSizeK.value = 1.26 * lensK / Math.max(bufSize.y, 1);
      // moths
      // where we are looking, eased, so the two that come with us hang in the view without being pinned to it
      camera.getWorldDirection(cf);
      if (!gazeSet || gz.dot(cf) < 0.8) { gz.copy(cf); gr.setFromMatrixColumn(camera.matrixWorld, 0); gu.setFromMatrixColumn(camera.matrixWorld, 1); gazeSet = true; }
      else { const kk = 1 - Math.exp(-4 * Math.min(dt, 0.1)); gz.lerp(cf, kk).normalize(); gr.lerp(lp.setFromMatrixColumn(camera.matrixWorld, 0), kk).normalize(); gu.lerp(lp.setFromMatrixColumn(camera.matrixWorld, 1), kk).normalize(); }
      // the sky's anchor in the slit as the route sees it (also where the first moth is bound)
      path.posAtDist(u * PL, pp);
      const aK = skyKey(u, 2) * DEG + 0.012 * Math.sin(t * 0.05);
      slitDir(skyKey(u, 1), aK, sv0);
      for (let i = 0; i < NM; i++) {
        let size = mothP[i].size;
        if (i >= LM0) {
          // the lanterns' own moths: tight loops round the ruby glass (their shadows cross its pool)
          const p = mothP[i], c = lanternAt[(i - LM0) >> 1], a = p.a + t * p.w * 1.3, r = p.r * (0.8 + 0.3 * Math.sin(t * p.wob + i)), sg = p.w > 0 ? 1 : -1;
          orb.set(c.x + Math.cos(a) * r, c.y + fy + 0.3 + p.h + 0.6 * Math.sin(t * p.wob * 1.7 + i * 2.1), c.z + Math.sin(a) * r);
          fwd.set(-Math.sin(a) * sg, 0.3 * Math.cos(t * p.wob * 1.7 + i * 2.1), Math.cos(a) * sg);
          placeMoth(i, orb, fwd, size, 0.25 * Math.sin(t * 2.3 + i * 1.7));
          continue;
        }
        if (i >= IN0) {
          // two pale ones that fall in with us on the way down to the tail (ahead, low and to the right, over the dark deck), then lead us up the tube: a little
          // ahead and to one side of the axis, wings in the beam, gone ahead of us before the portal
          const j = i - IN0, kIn = sstep(0.6, 0.64, u), kB = sstep(0.745, 0.8, u), k = ctx.through ? 0 : sstep(0.6, 0.61, u) * (1 - sstep(0.895, 0.93, u));
          const s = camS + 27 + 8 * j + 2.0 * Math.sin(t * 0.7 + j * 2) + 90 * sstep(0.88, 0.93, u);
          const a = 3.5 + 1.4 * j + 0.45 * Math.sin(t * 0.5 + j * 1.7), r = 3.6 + 0.8 * j + 0.5 * Math.sin(t * 1.1 + j * 3);
          const ca = Math.cos(a), sa = Math.sin(a);
          orb.set(piv.x + ax.x * s + ca * r, piv.y + ax.y * s + sa * ax.z * r, piv.z + ax.z * s - sa * ax.y * r);
          fwd.copy(ax).multiplyScalar(0.4).addScaledVector(gu, 1.0 + 0.2 * Math.cos(t * 1.9 + j)).addScaledVector(gr, 0.2 * Math.cos(t * 1.3 + j * 2));
          if (kB < 1) {
            lp.copy(pos).addScaledVector(gz, 24 + 3 * j - 30 * (1 - kIn) + 0.6 * Math.sin(t * 0.8 + j)).addScaledVector(gr, 6 + 3 * j + 0.6 * Math.sin(t * 1.3 + j * 2))
              .addScaledVector(gu, -(4.5 + 1.2 * j) + 0.5 * Math.sin(t * 1.9 + j * 1.3));
            tg.copy(gz).multiplyScalar(0.3).addScaledVector(gu, 1.0 + 0.2 * Math.cos(t * 1.9 + j * 1.3)).addScaledVector(gr, 0.25 * Math.cos(t * 1.3 + j * 2));
            orb.lerp(lp, 1 - kB); fwd.lerp(tg, 1 - kB);
          }
          placeMoth(i, orb, fwd, Math.max(size * k * (0.85 + 0.15 * kB), 1e-4), 0.3 * Math.sin(t * 2.0 + j * 1.9));
          continue;
        }
        if (i >= TM0) {
          // the moths that have found the white tube: they swing to and fro over its west flank once it has settled in the light
          // the first few keep a little ahead of us down the flank, the rest hold their stations along the tube
          const p = mothP[i], j = i - TM0, ph = t * p.w + i * 1.9, a = p.a + (j < NCOMP ? 0.6 : 1) * Math.sin(ph);
          const s = j < NCOMP ? Math.max(camS - 14 - 7 * j + 3 * Math.sin(t * 0.21 * p.wob + i), -86 + 4 * j) : p.s + 5 * Math.sin(t * 0.21 * p.wob + i);
          const ca = Math.cos(a), sa = Math.sin(a), r = p.r + 1.2 * Math.sin(t * p.wob + i * 2.3), sg = Math.cos(ph) * p.w >= 0 ? 1 : -1;
          orb.set(piv.x + ax.x * s - ca * r, piv.y + ax.y * s + sa * ax.z * r, piv.z + ax.z * s - sa * ax.y * r);
          fwd.set(sa * sg, ca * ax.z * sg + 0.3 * Math.cos(t * p.wob + i * 2.3), -ca * ax.y * sg);
          placeMoth(i, orb, fwd, Math.max(size * sstep(0.3, 0.36, u), 1e-4), 0.3 * Math.sin(t * 2.1 + i));
          continue;
        }
        orbitOf(i, t, orb, fwd);
        if (i < 2) {
          // the two that come with us: eight metres ahead, a little left and below, backs to us so the four wings show
          const k = ctx.through ? 0 : sstep(0.06, 0.115, u);      // (nothing comes with the camera while we are seen through a portal)
          if (k > 0) {
            lp.copy(pos).addScaledVector(gz, 15 + 2.2 * i + 0.5 * Math.sin(t * 0.8 + i)).addScaledVector(gr, -(4.4 + 2.6 * i) + 0.5 * Math.sin(t * 1.3 + i * 2))
              .addScaledVector(gu, -(2.2 + 1.0 * i) + 0.4 * Math.sin(t * 1.9 + i * 1.3));
            tg.copy(gz).multiplyScalar(0.3).addScaledVector(gu, 1.0 + 0.2 * Math.cos(t * 1.9 + i * 1.3)).addScaledVector(gr, 0.25 * Math.cos(t * 1.3 + i * 2));      // climbing, backs to us: the four wings show
            if (i === 0) {
              // when the starlight comes up it leaves us for the slit
              const k2 = sstep(0.25, 0.33, u), k4 = sstep(0.33, 0.42, u);
              lp.addScaledVector(sv0, k2 * k2 * 110 + k4 * 420); tg.lerp(sv0, k2); size *= (1 - 0.3 * k2) * (1 - k4);
              orb.lerp(lp, k); fwd.lerp(tg, k);
            } else {
              // the other turns back for its lamp
              const k3 = k * (1 - sstep(0.23, 0.3, u));
              orb.lerp(lp, k3); fwd.lerp(tg, k3);
            }
          }
        }
        placeMoth(i, orb, fwd, Math.max(size, 1e-4), 0.5 * Math.sin(t * (1.7 + 0.13 * (i % 5)) + i * 1.7) + 0.35 * Math.sin(i * 2.4));
      }
      // seven that climb the bar of starlight beside the upper tube, one after another, and are lost under the slit. Their lane is made on
      // the settled axis and then CARRIED BY THE TUBE'S OWN POSE of the frame (the part's bone 2; the identity once the tube has settled),
      // so while the tube slews they keep beside it and never pass through it
      for (let j = 0; j < NRISE; j++) {
        const p = riseP[j], cyc = (t / RISE_T + p.ph) % 1, s = 26 + 136 * cyc, cl = sstep(124, 156, s);
        const a = p.a + 0.3 * Math.sin(t * p.w + j * 2.1), r = (p.r + 0.75 * Math.sin(t * p.wob + j * 1.7)) * (1 - 0.75 * cl), ca = Math.cos(a), sa = Math.sin(a);
        orb.set(piv.x + ax.x * s + sa * r, piv.y + ax.y * s + ca * ax.z * r, piv.z + ax.z * s - ca * ax.y * r);
        bz.copy(ax).addScaledVector(up, 0.9 + 0.2 * Math.cos(t * p.wob * 1.7 + j)); bz.x += 0.3 * Math.cos(t * p.w + j * 2.1) - 0.4 * cl * sa; bz.normalize();
        by.copy(ax).multiplyScalar(-1).addScaledVector(bz, ax.dot(bz)).normalize(); bx.crossVectors(by, bz);
        { const ro = 0.35 * Math.sin(t * 1.9 + j * 2.3), c = Math.cos(ro), sn = Math.sin(ro); tg.copy(bx).multiplyScalar(c).addScaledVector(by, sn); by.multiplyScalar(c).addScaledVector(bx, -sn); bx.copy(tg); }
        // (lost before the dome's timber, by its own place: its size falls with its distance from the dome's centre, where the tube carries it that frame)
        const gone = sstep(143.9, 153.2, tg.copy(orb).applyMatrix4(tubeNow).distanceTo(piv));
        m4.makeBasis(bx, by, bz).scale(scl.setScalar(Math.max(p.size * sstep(0, 0.05, cyc) * (1 - gone), 1e-4))).setPosition(orb); moths.setMatrixAt(NM + j, m4.premultiply(tubeNow));
      }
      moths.instanceMatrix.needsUpdate = true;
      // the sky: world direction sv0 shows the Large Cloud, the slit's own run shows the Milky Way; one meteor at u 0.30, and on
      // a rare night a green fireball down the length of the slit at 0.305-0.32
      sv1.set(-Math.sin(aK) * sdm, Math.cos(aK), -Math.sin(aK) * cdm); sv1.addScaledVector(sv0, -sv1.dot(sv0)).normalize(); sv2.crossVectors(sv0, sv1);
      skyU.uRot.value.set(
        SKL.x * sv0.x + SKT.x * sv1.x + SKB.x * sv2.x, SKL.x * sv0.y + SKT.x * sv1.y + SKB.x * sv2.y, SKL.x * sv0.z + SKT.x * sv1.z + SKB.x * sv2.z,
        SKL.y * sv0.x + SKT.y * sv1.x + SKB.y * sv2.x, SKL.y * sv0.y + SKT.y * sv1.y + SKB.y * sv2.y, SKL.y * sv0.z + SKT.y * sv1.z + SKB.y * sv2.z,
        SKL.z * sv0.x + SKT.z * sv1.x + SKB.z * sv2.x, SKL.z * sv0.y + SKT.z * sv1.y + SKB.z * sv2.y, SKL.z * sv0.z + SKT.z * sv1.z + SKB.z * sv2.z);
      skyU.uTime.value = t;
      const m1 = (u - 0.2965) / 0.007, m2 = rare ? (u - 0.305) / 0.015 : -1;
      if (m1 > 0 && m1 < 1) {
        const b = Math.sin(Math.PI * m1);
        slitDir(-22, 46 * DEG, sA); slitDir(-10, 24 * DEG, sB);
        skyU.uMetB.value.lerpVectors(sA, sB, m1).normalize(); skyU.uMetA.value.lerpVectors(sA, sB, Math.max(0, m1 - 0.3)).normalize();
        skyU.uMet.value.set(metCol.r * 4 * b, metCol.g * 4 * b, metCol.b * 4 * b, 1); skyU.uMet2.value.set(2, 0);
      } else if (m2 > 0 && m2 < 1) {
        const b = Math.sqrt(Math.sin(Math.PI * m2));
        slitDir(6, 64 * DEG, sA); slitDir(-18, 12 * DEG, sB);
        skyU.uMetB.value.lerpVectors(sA, sB, m2).normalize(); skyU.uMetA.value.lerpVectors(sA, sB, Math.max(0, m2 - 0.55)).normalize();
        skyU.uMet.value.set(fireCol.r * b, fireCol.g * b, fireCol.b * b, 2.4); skyU.uMet2.value.set(1.3, 0.4);
      } else skyU.uMet.value.set(0, 0, 0, 1);
    }

    // easy over the desk, slow past the governor, slower still for the whole machine in the starlight, quick up the flank and down
    // again, slow at the tail, then steadily up the tube
    const pace = (u) => 0.95 - 0.3 * sstep(0.13, 0.16, u) + 0.3 * sstep(0.19, 0.22, u) - 0.4 * sstep(0.26, 0.3, u) + 0.55 * sstep(0.36, 0.4, u) + 0.2 * sstep(0.53, 0.58, u)
      - 0.55 * sstep(0.66, 0.7, u) + 0.35 * sstep(0.73, 0.78, u) - 0.1 * sstep(0.87, 0.93, u);
    // the gaze: each subject is listed several times over, so the steadier camera (which takes a third of every weight) holds it too
    const hold = (at, from, to, weight, n, fade) => { const o = []; for (let i = 0; i < n; i++) o.push({ at, from, to, weight, fade }); return o; };
    const deskP = new V3(), deskAt = () => deskP.set(DX, TOP + 2 + hero.floorY(), DZ);
    // the first look is up at the instrument (the dome's centre, where the tube turns) for the first half of the way in from
    // the door to the desk: from half way the eye is the desk's, as it always was. Listed once: the steadier camera takes a
    // glance of it, not a hold.
    let uUp = 0; { const q = new V3(), half = Math.hypot(ENTRY[0] - DX, ENTRY[2] - DZ) / 2; for (let d = 0; d < PL && !uUp; d += 0.25) { path.posAtDist(d, q); if (Math.hypot(q.x - DX, q.z - DZ) <= half) uUp = d / PL; } }
    // THE IRIS in the tube (the piece's, behind its fourth baffle ring): closed until the route's own line is 65 m short of the leaves' plane,
    // measured along the tube's axis, and open from where it is 26 m short; a smoothstep in u between. The two ends are read from the
    // route here, once (from the far end back, since the route passes those heights of the axis once before, wide of the tube), not typed.
    // (26 m and not nearer: the two moths that lead us up the tube fly 27 to 35 m ahead and cross the leaves' plane while it opens; counted,
    // the later of them then has over a metre of clear air to every leaf.)
    let uIris0 = 0, uIris1 = 0; { const q = new V3(); for (let d = PL; d > 0 && !uIris0; d -= 0.25) { path.posAtDist(d, q); const sq = (q.x - piv.x) * ax.x + (q.y - piv.y) * ax.y + (q.z - piv.z) * ax.z;
      if (!uIris1 && sq <= A.irisS - 26) uIris1 = d / PL; if (sq <= A.irisS - 65) uIris0 = d / PL; } }
    return {
      scene, path, duration: 58, pace,
      camera: { fov: 70, near: 0.4, far: 3000, lookAhead: 30, sway: 0.8, bank: 0.14 },
      pois: [
        ...hold(deskAt, 0, 0.125, 0.8, 2, 0.25),                                                  // the green pool on the charts as we come in over it
        ...(uUp > 0 ? hold(piv, 0, uUp, 0.5, 1, 0.5) : []),                                                    // the first look is up: the pier, the parked tube and the dome with its blade of stars, before the eye comes down to the desk
        ...hold(A.governor.clone().add(new V3(-7, 3, 5)), 0.1, 0.215, 0.85, 8, 0.3),              // the driving clock in its ruby-lit case, the pier to one side
        ...hold(new V3(0, 145, 3), 0.195, 0.3, 0.85, 8, 0.25),                                    // the whole instrument side-on from the west as the starlight comes up
        ...hold(new V3(4, 176, 38), 0.275, 0.39, 0.85, 8, 0.2),                                   // from the north-west: the tube aimed into the open slit, the sky whole beyond it
        ...hold(new V3(-6, 192, 36), 0.385, 0.475, 0.8, 6, 0.3),                                  // over the counterweights and the saddle, up the white tube
        ...hold(new V3(0, 240, 78), 0.46, 0.545, 0.8, 6, 0.25),                                    // up the white flank to the brass cell against the sky
        ...hold(A.tail.clone().add(new V3(-4, -4, 2)), 0.53, 0.735, 0.85, 7, 0.14),               // down the east flank to the brass tail, the desk's green pool beyond it
        ...hold(new V3(-20, 69, -69), 0.708, 0.782, 0.8, 3, 0.5),                                 // turning in behind the tail: the observer's chair in the middle, the whole eyepiece end and its brass wheels above it
      ],
      portal: { shape: 'circle', radius: 6, color: '#A9C6F2', glow: 0.6, halo: false, tilt: true },
      post: { exposure: 1.02, bloom: { strength: 0.42, radius: 0.6, threshold: 1.0 },
        grade: { saturation: L.sat, contrast: 1.0, tint: L.tint, shadowTint: L.shadow, vignette: 0.34, grain: 0.03, aberration: 0 } },
      ride: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
