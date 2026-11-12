// Stall recorder. A journey with no controls has nowhere to hide a hitch, so the engine keeps a small log of every
// frame that arrived late and of what it was doing at the time. It costs a few comparisons per frame.
// engine.perf.report() is a short text a viewer can copy and send back (Shift+P on the page, or the button at the
// foot of the hidden index); tools/hitch.mjs prints it for a headless journey.
//
// Words used: a "stall" is a frame that took over 50 ms and more than two and a half times the usual frame;
// "cause" is the heaviest piece of work the engine itself timed since the previous frame, or else what the
// engine was in the middle of (a world being built, compiled, warmed, shown for the first time, cleared away).

const STALL_MS = 50, KEEP = 80;

export class Perf {
  constructor() {
    this.t0 = performance.now(); this.stalls = []; this.longs = []; this.marks = []; this.loads = []; this.inView = [];
    this.phase = ''; this.norm = 16.7; this.gaps = []; this.gi = 0; this.frames = 0; this.skip = 2;
    this.sum = { n: 0, ms: 0, worst: 0, n100: 0, n250: 0, n1000: 0 }; this.by = {}; this.waitMs = 0;
    // a tab that was hidden did not stall
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { this.skip = 3; });
    // main-thread work over 50 ms that happens between frames (a world's build steps) is reported by the browser
    try {
      this.obs = new PerformanceObserver((l) => { for (const e of l.getEntries()) this._long(e.startTime, e.duration); });
      this.obs.observe({ entryTypes: ['longtask'] });
    } catch (e) { /* not every browser has it */ }
  }
  // work the engine timed itself: tag such as 'first-draw:<world>', 'swap', 'clear', 'resize'
  mark(tag, ms) { if (ms >= 1) this.marks.push([tag, ms]); }
  // what the loader is busy with ('' when idle); long tasks and unexplained stalls are attributed to it
  setPhase(p) { this.phase = p; }
  // shader programs that were compiled while a frame was being drawn: names are 'MaterialType:material name'
  shaders(id, u, names, ms) {
    const short = names.length + ' ' + [...new Set(names)].slice(0, 6).join(',');
    this.inView.push({ t: (performance.now() - this.t0) / 1000, id, u, ms: Math.round(ms), names: short }); if (this.inView.length > 40) this.inView.shift();
    this.marks.push(['shaders ' + short, Math.max(ms, 1e6)]);       // if this frame is late, this is why
  }
  load(rec) { this.loads.push(rec); if (this.loads.length > 40) this.loads.shift(); }
  wait(ms) { this.waitMs += ms; }
  _long(start, ms) {
    this.longs.push({ t: (start - this.t0) / 1000, ms: Math.round(ms), phase: this.phase });
    if (this.longs.length > KEEP) this.longs.shift();
    const k = 'js ' + (this.phase.split(':')[0] || 'other'), b = this.by[k] || (this.by[k] = { n: 0, ms: 0 }); b.n++; b.ms += ms;
  }
  // every frame: gap is the time since the previous frame in ms; ctx: { id, u, paused }
  frame(now, gap, ctx) {
    this.frames++;
    const marks = this.marks; this.marks = [];
    if (this.skip > 0 || ctx.paused) { this.skip = Math.max(0, this.skip - 1); return; }
    // the usual frame is the median of the last 31, so a slow machine's ordinary frames are not counted as stalls
    const g = this.gaps; g[this.gi++ % 31] = gap;
    if (this.gi % 8 === 0) { const srt = g.slice().sort((x, y) => x - y); this.norm = srt[srt.length >> 1]; }
    if (gap < STALL_MS || gap < this.norm * 2.5) return;
    let cause = '', top = 0; for (const [tag, ms] of marks) if (ms > top) { top = ms; cause = tag; }
    if (top < gap * 0.3) cause = this.phase ? this.phase + (cause ? '+' + cause : '') : (cause || 'unknown');
    const over = gap - this.norm, s = this.sum;
    s.n++; s.ms += over; if (gap > s.worst) s.worst = gap; if (gap >= 100) s.n100++; if (gap >= 250) s.n250++; if (gap >= 1000) s.n1000++;
    const k = cause.startsWith('shaders') ? 'shaders in view' : cause.split(':')[0], b = this.by[k] || (this.by[k] = { n: 0, ms: 0 }); b.n++; b.ms += over;
    this.stalls.push({ t: (now - this.t0) / 1000, ms: Math.round(gap), id: ctx.id, u: ctx.u, cause });
    if (this.stalls.length > KEEP) this.stalls.shift();
  }
  summary() {
    const s = this.sum, by = {}; for (const k in this.by) by[k] = { n: this.by[k].n, ms: Math.round(this.by[k].ms) };
    return { seconds: Math.round((performance.now() - this.t0) / 1000), frames: this.frames, frameMs: Math.round(this.norm * 10) / 10, stalls: s.n, stalledMs: Math.round(s.ms), worstMs: Math.round(s.worst),
      over100: s.n100, over250: s.n250, over1000: s.n1000, waitedAtPortalMs: Math.round(this.waitMs), by, loads: this.loads.slice(), inView: this.inView.slice(), last: this.stalls.slice(-30), longTasks: this.longs.slice(-30) };
  }
  // the text a viewer sends back
  report(head = []) {
    const r = this.summary(), L = [...head];
    L.push(`${r.seconds} s, ${r.frames} frames, usual frame ${r.frameMs} ms`);
    L.push(`stalls over 50 ms: ${r.stalls} (over 100 ms: ${r.over100}, over 250 ms: ${r.over250}, over 1 s: ${r.over1000}); time lost ${r.stalledMs} ms; worst ${r.worstMs} ms; waited at a portal ${r.waitedAtPortalMs} ms`);
    L.push('by cause: ' + (Object.entries(r.by).sort((a, b) => b[1].ms - a[1].ms).map(([k, v]) => `${k} ${v.ms} ms in ${v.n}`).join('; ') || 'none'));
    L.push('worlds loaded (ms): ' + r.loads.map((l) => `${l.id} build ${l.build} (longest step ${l.step}) shaders ${l.compile} for ${l.programs} warm ${l.warm} late ${l.late ?? '?'}`).join(' | '));
    L.push('shaders compiled in view: ' + (r.inView.map((s) => `${s.t.toFixed(1)}s ${s.ms}ms ${s.id}@${Math.round(s.u * 100)} ${s.names}`).join(' | ') || 'none'));
    // a late frame with no long script task inside it was spent outside this page's script: the graphics process or the browser
    const idle = (s) => !this.longs.some((l) => l.t < s.t && l.t + l.ms / 1000 > s.t - s.ms / 1000);
    L.push('stalls: ' + r.last.map((s) => `${s.t.toFixed(1)}s ${s.ms}ms ${s.id}@${Math.round(s.u * 100)} ${s.cause}${this.obs && idle(s) ? ' [no script]' : ''}`).join(' | '));
    L.push('long tasks: ' + r.longTasks.map((s) => `${s.t.toFixed(1)}s ${s.ms}ms ${s.phase || '-'}`).join(' | '));
    return L.join('\n');
  }
}
