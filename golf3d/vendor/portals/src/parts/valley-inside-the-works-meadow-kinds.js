// valley-inside-the-works, the meadow: THE KINDS. For each plant of the hay meadow: its form, the lattice it is dealt
// on (metres), the drift it keeps to (a channel of the field), how thick it stands at a drift's heart (peak), how much
// thinner beyond the near ground (thin), its sizes, its tints, and what it is drawn as far off (far).
// low: a kind that may stand inside the tube behind the entry (see the planting): the low ones only.
import * as FORM from './valley-inside-the-works-meadow-forms.js';
import { CH, smooth } from './valley-inside-the-works-meadow-field.js';

export function makeKinds(THREE, fr, field) {
  const wetSide = (x, z) => field.noise.n2(x / 8.5 + 3.3, z / 8.5 - 7.1);
  return [
    { name: 'hay', low: true, form: FORM.hay(THREE, fr), cell: 0.96, chan: CH.tall, peak: 0.95, shun: true, thin: 0.42, size: [0.75, 1.3],
      tint: (t) => [0.8 + 0.4 * t, 0.86 + 0.28 * t, 0.8 + 0.3 * t],
      far(p, push) {
        // (far off: the blades, or the plume, or both; a plume with no blades under it is one slim spindle from the
        // ground to its tip, stalk and plume in one, so that no plume hangs in the air)
        const lone = p.far >= 0.7;
        if (!lone) push('tuft', p.x, p.y, p.z, p.yaw, 0.95 * p.s, 1.0 * p.s, 0.95 * p.s, 0.07 * p.c[0], 0.2 * p.c[1], 0.035 * p.c[2]);
        if (p.far > 0.55) push('puff', p.x, p.y + (lone ? 0 : 1.0) * p.s, p.z, p.yaw, (lone ? 0.075 : 0.1) * p.s, (lone ? 1.7 : 0.7) * p.s, (lone ? 0.075 : 0.1) * p.s, 0.42, 0.3, 0.11);
      } },
    { name: 'daisy', low: true, form: FORM.daisy(THREE, fr), cell: 0.61, chan: CH.daisy, peak: 0.72, shun: true, thin: 0.5, size: [0.72, 1.15],
      tint: (t) => { const k = 0.92 + 0.16 * t; return [k, k, k]; },
      far(p, push) { push('disc', p.x, p.y + 1.6 * p.s, p.z, p.yaw, 0.22 * p.s, 0.22 * p.s, 0.22 * p.s, 0.62 * p.c[0], 0.62 * p.c[1], 0.57 * p.c[2]); } },
    { name: 'clover', low: true, form: FORM.clover(THREE, fr), cell: 0.63, chan: CH.clover, peak: 0.65, shun: true, thin: 0.5, size: [0.8, 1.2],
      tint: (t) => [0.85 + 0.35 * t, 0.9, 1.1 - 0.3 * t],
      far(p, push) { push('puff', p.x, p.y + 0.84 * p.s, p.z, p.yaw, 0.14 * p.s, 0.26 * p.s, 0.14 * p.s, 0.52 * p.c[0], 0.17 * p.c[1], 0.34 * p.c[2]); } },
    { name: 'parsley', form: FORM.parsley(THREE, fr), cell: 1.5, chan: CH.parsley, peak: 0.7, thin: 0.5, size: [0.62, 1.08],
      tint: (t) => { const k = 0.9 + 0.2 * t; return [k, k, k]; },
      far(p, push) {
        for (let u = 0; u < 3; u++) { const a = p.yaw + u * 2.1, out = u ? 0.6 * p.s : 0.1; push('disc', p.x + Math.cos(a) * out, p.y + (u ? 2.55 : 3.0) * p.s, p.z + Math.sin(a) * out, a, 0.44 * p.s, 0.3 * p.s, 0.44 * p.s, 0.6, 0.61, 0.52); }
        push('tuft', p.x, p.y, p.z, p.yaw, 0.9 * p.s, 1.3 * p.s, 0.9 * p.s, 0.06, 0.18, 0.035);
      } },
    { name: 'foxglove', form: FORM.foxglove(THREE, fr), cell: 1.15, chan: CH.fox, peak: 0.85, thin: 0.75, size: [0.72, 1.12],
      tint: (t) => [0.85 + 0.3 * t, 0.85 + 0.3 * t * t, 0.9 + 0.2 * t],
      far(p, push) {
        push('puff', p.x, p.y + 1.5 * p.s, p.z, p.yaw, 0.2 * p.s, 2.2 * p.s, 0.2 * p.s, 0.55 * p.c[0], 0.2 * p.c[1], 0.45 * p.c[2]);
        // (far off the spire stands on its own leafy stem: a narrow sheaf of blades from the ground up round the foot of
        // the spire, so that the stem is seen whole from the turf to the lowest bells)
        push('tuft', p.x, p.y, p.z, p.yaw, 0.16 * p.s, 2.3 * p.s, 0.16 * p.s, 0.06, 0.17, 0.04);
      } },
    { name: 'iris', form: FORM.iris(THREE, fr), cell: 0.8, chan: CH.wet, peak: 0.95, thin: 0.85, size: [0.75, 1.15], where: (x, z) => smooth(-0.15, 0.15, wetSide(x, z)),
      tint: (t) => [0.9 + 0.2 * t, 0.9 + 0.2 * t, 0.9 + 0.2 * t],
      far(p, push) {
        push('tuft', p.x, p.y, p.z, p.yaw, 0.7 * p.s, 2.6 * p.s, 0.7 * p.s, 0.05, 0.19, 0.06);
        push('disc', p.x, p.y + 2.5 * p.s, p.z, p.yaw, 0.3 * p.s, 0.3 * p.s, 0.3 * p.s, 0.66, 0.52, 0.06);
      } },
    { name: 'reed', form: FORM.reed(THREE, fr), cell: 0.95, chan: CH.wet, peak: 0.9, thin: 0.85, size: [0.7, 1.1], where: (x, z) => smooth(0.1, -0.2, wetSide(x, z)),
      tint: (t) => [0.9 + 0.2 * t, 0.9 + 0.2 * t, 0.9 + 0.2 * t],
      far(p, push) {
        push('tuft', p.x, p.y, p.z, p.yaw, 0.8 * p.s, 3.8 * p.s, 0.8 * p.s, 0.06, 0.2, 0.06);
        push('puff', p.x, p.y + 3.4 * p.s, p.z, p.yaw, 0.12 * p.s, 0.9 * p.s, 0.12 * p.s, 0.36, 0.25, 0.11);
      } },
    { name: 'bluebell', form: FORM.bluebell(THREE, fr), cell: 0.56, chan: CH.shade, peak: 0.7, thin: 0.6, size: [0.8, 1.2],
      tint: (t) => [0.85 + 0.3 * t, 0.9 + 0.2 * t, 1],
      far(p, push) { push('puff', p.x, p.y + 0.55 * p.s, p.z, p.yaw, 0.2 * p.s, 0.5 * p.s, 0.2 * p.s, 0.16, 0.19, 0.6); } },
    // THE SWARD: plain long grass wherever the meadow lies open between its drifts, so that real blades stand over the
    // turf's paint everywhere near the flown line and the paint is never seen as a bare picture (a tuft of five blades
    // in the turf's own deep greens; it gives way in the trees' shade, and is the same far off as near)
    { name: 'sward', low: true, form: FORM.loTuft(THREE, fr), cell: 1.0, chan: CH.open, peak: 0.62, shun: true, thin: 1, size: [0.75, 1.25],
      tint: (t) => [0.04 + 0.025 * t, 0.12 + 0.05 * t, 0.026 + 0.012 * t],
      far(p, push) { push('tuft', p.x, p.y, p.z, p.yaw, p.s, p.s, p.s, p.c[0], p.c[1], p.c[2]); } },
  ];
}
