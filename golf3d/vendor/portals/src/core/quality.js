// Graphics quality: four levels, a guess at the right one for this machine, and the numbers each one means.
// The engine applies them (engine.setQuality) and, on 'auto', also steps down by itself when frames stay slow.

export const QUALITY_LEVELS = ['low', 'medium', 'high', 'ultra'];
export const QUALITY_NAMES = { low: 'Low', medium: 'Medium', high: 'High', ultra: 'Ultra' };

// pixels: how many pixels the picture may have (the page is drawn at a lower resolution and scaled up when the
//   screen has more); maxRatio: never sharper than this many pixels per CSS pixel; floor: how far the adaptive
//   resolution may drop below that, as a fraction; samples: antialiasing; shadow: largest shadow map side;
//   detail: a 0..1 hint that worlds may use to thin out their particles and instances.
export const TIERS = {
  low:    { pixels: 0.95e6, maxRatio: 2,   floor: 0.6,  samples: 0, shadow: 1024, detail: 0.6,  adapt: true },
  medium: { pixels: 1.7e6,  maxRatio: 2,   floor: 0.65, samples: 2, shadow: 2048, detail: 0.8,  adapt: true },
  high:   { pixels: 3.7e6,  maxRatio: 2,   floor: 0.7,  samples: 4, shadow: 4096, detail: 1,    adapt: true },
  ultra:  { pixels: 8.4e6,  maxRatio: 3,   floor: 1,    samples: 4, shadow: 8192, detail: 1,    adapt: false },
};

export function isMobile() {
  const ua = navigator.userAgent || '';
  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean' && navigator.userAgentData.mobile) return true;
  if (/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua)) return true;
  return /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1;   // an iPad that says it is a Mac
}

export function gpuName(renderer) {
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return String((ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '');
  } catch (e) { return ''; }
}

// A first guess from what the browser says about the machine. It errs low: the adaptive resolution can make a
// fast machine sharper within its level, but a slow first minute is what makes people leave.
export function guessTier(renderer) {
  const gpu = gpuName(renderer), mem = navigator.deviceMemory || 0, cores = navigator.hardwareConcurrency || 0;
  if (/swiftshader|llvmpipe|software|basic render|softpipe/i.test(gpu)) return 'low';
  if (isMobile()) {
    if ((mem && mem <= 4) || (cores && cores <= 4)) return 'low';
    if (/Mali-(4|T|G5|G3)|Adreno \(TM\) [1-5]\d\d|PowerVR|Tegra/i.test(gpu)) return 'low';
    return 'medium';
  }
  if (/nvidia|geforce|rtx|gtx|quadro|radeon rx|radeon pro|radeon \(tm\) rx|arc\(tm\) a|apple m\d/i.test(gpu)) return 'high';
  if (/apple gpu|apple m/i.test(gpu)) return 'high';
  if (/intel|uhd|iris|hd graphics|radeon\(tm\) graphics|radeon graphics|vega|adreno|mali/i.test(gpu)) return 'medium';
  if ((mem && mem <= 4) || (cores && cores <= 4)) return 'medium';
  return 'high';
}

// The sharpest pixel ratio a level allows for a window of w x h CSS pixels.
export function ratioFor(tier, w, h, dpr = window.devicePixelRatio || 1) {
  const t = TIERS[tier] || TIERS.high;
  return Math.max(0.35, Math.min(dpr, t.maxRatio, Math.sqrt(t.pixels / Math.max(1, w * h))));
}

// A tall, narrow window (a phone held upright) sees very little of a world at the usual field of view, so the
// view opens up as the window narrows: unchanged from about 16:10 upward, about 90 degrees tall on a 9:16 phone.
export function fovFor(fov, aspect) {
  if (aspect >= 1.6) return fov;
  const k = Math.sqrt(1.6 / Math.max(0.4, aspect));
  return Math.min(100, (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * k) * 180) / Math.PI);
}

// Adaptive resolution. Feed it every frame's duration; every ninety frames it may answer with a new pixel ratio
// ({ pr }) or, on 'auto', ask for the next level down ({ down: true }).
// If frames are slow it draws fewer pixels; if they are fast, more. A drop is only kept if it made frames
// faster: when it does not (a 30 Hz screen, a battery saver, a slow processor), the resolution goes back up and
// is left alone for a while. A machine still slow at the coarsest resolution of its level moves down a level.
export class Governor {
  constructor() { this.ft = []; this.fps = 0; this.reset(-1e9); }
  reset(now) { this.ft.length = 0; this.futile = 0; this.slow = 0; this.naps = 0; this.sleepUntil = 0; this.pending = 0; this.before = 0; this.lastRaise = -1e9; this.raiseWait = 0; this.noRaiseUntil = 0; this.lastChange = now; }
  // raw: seconds the last frame took; now: milliseconds; s: { pr, minPR, maxPR, canDown }
  tick(raw, now, s) {
    if (raw > 0.25) return null;                          // a hitch while a world is being built is not the frame rate
    const ft = this.ft; ft.push(raw); if (ft.length < 90) return null;
    ft.sort((a, b) => a - b); let avg = 0; for (let i = 0; i < 81; i++) avg += ft[i]; avg /= 81; ft.length = 0;   // the slowest tenth are hitches
    this.fps = 1 / avg;
    if (now - this.lastChange < 2500 || now < this.sleepUntil) return null;
    const set = (pr) => { this.lastChange = now; return { pr: Math.min(s.maxPR, Math.max(s.minPR, pr)) }; };
    if (this.pending) {
      this.futile = avg < this.pending * 0.93 ? 0 : this.futile + 1; this.pending = 0;
      if (this.futile >= 2) {
        this.futile = 0; this.naps = Math.min(this.naps + 1, 5); this.sleepUntil = now + 300000 * 4 ** (this.naps - 1);   // five minutes, then twenty, then eighty
        return set(this.before);
      }
    }
    if (avg > 1 / 43) {
      // a raise that had to be taken back makes the next raise wait longer
      if (now - this.lastRaise < 15000) { this.raiseWait = Math.min(this.raiseWait ? this.raiseWait * 2 : 30000, 600000); this.noRaiseUntil = now + this.raiseWait; this.lastRaise = -1e9; }
      if (s.pr > s.minPR + 0.01) { if (!this.futile) this.before = s.pr; this.pending = avg; this.slow = 0; return set(s.pr * 0.85); }
      if (s.canDown && avg > 1 / 34 && ++this.slow >= 3) { this.slow = 0; return { down: true }; }
    } else {
      this.slow = 0;
      if (avg < 1 / 57 && s.pr < s.maxPR - 0.01 && now > this.noRaiseUntil) { this.lastRaise = now; return set(s.pr * 1.08); }
    }
    return null;
  }
}
