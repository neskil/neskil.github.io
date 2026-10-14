// game/perf.js — graphics quality tiers and the adaptive governor that moves
// between them when the frame rate can't keep up.
//
// Two parts:
//   QualityGovernor — pure decision logic (no DOM, no game), fed one sample
//                     per rendered frame. tests.html drives it with synthetic
//                     frame times.
//   CargoGame mixin — owns the Settings choice (Auto or a fixed tier), applies
//                     a tier (render scale, post-FX, star density) and feeds
//                     the governor from loop().
//
// Hysteresis, so a frame rate hovering near a threshold doesn't flip quality
// back and forth:
//   - separate down/up thresholds (85% vs 95% of target) with a dead band
//     between them where nothing moves;
//   - stepping down needs 2 slow windows in a row (or 1 very slow one);
//     stepping up needs 4 good windows in a row *and* CPU headroom;
//   - every change is followed by a settle period that isn't measured
//     (the canvas resize itself costs a frame or two);
//   - a tier that is entered on the way up and has to be left again within
//     FLIP_MS gets banned from upgrades for 30s, then 60s, 120s... and for
//     the rest of the session after 3 strikes;
//   - a step down that bought nothing (the cost is elsewhere — physics, a
//     display capped below 60Hz) is undone and becomes the floor until the
//     next mission start, rather than ratcheting all the way to Lowest.

// Ordered best → cheapest. `scale` is the canvas backing-store multiplier
// ('dpr' = the screen's devicePixelRatio, capped at 2); `maxPixels` caps the
// backing store's pixel count whatever the screen — on a big display the
// frame is rendered smaller and the browser stretches the canvas back to
// full size (the HUD is HTML, so it stays sharp). Frame cost scales with
// pixels filled: before budgets a 4K screen at 1x cost ~4x a 1080p one at
// every tier. `starStride` draws every Nth background star.
const GFX_TIERS = [
    { id: 'crisp',  label: 'Crisp',  scale: 'dpr', maxPixels: 3840 * 2160, postFX: true,  starStride: 1 },  // native, up to 4K
    { id: 'sharp',  label: 'Sharp',  scale: 'dpr', maxPixels: 2560 * 1440, postFX: true,  starStride: 1 },  // up to 1440p
    { id: 'high',   label: 'High',   scale: 1,     maxPixels: 1920 * 1080, postFX: true,  starStride: 1 },  // up to 1080p
    { id: 'medium', label: 'Medium', scale: 0.85,  maxPixels: 1600 * 900,  postFX: false, starStride: 1 },
    { id: 'low',    label: 'Low',    scale: 0.7,   maxPixels: 1280 * 720,  postFX: false, starStride: 2 },
    { id: 'lowest', label: 'Lowest', scale: 0.55,  maxPixels: 960 * 540,   postFX: false, starStride: 2 },
];
const GFX_DEFAULT_TIER = 2; // 'high' — 1080p-class; Auto starts here and earns the sharper tiers

// Backing-store scale a tier gives on a (w x h) CSS-px viewport: its own
// scale, capped so the frame stays within its pixel budget. Rounded to 1%
// so tiny window drags don't reallocate the canvas.
function gfxScaleFor(tier, w, h, dpr) {
    const want = tier.scale === 'dpr' ? dpr : tier.scale;
    const cap = Math.sqrt(tier.maxPixels / Math.max(1, w * h));
    return Math.max(0.25, Math.round(Math.min(want, cap) * 100) / 100);
}

class QualityGovernor {
    constructor(opts = {}) {
        this.tierCount = opts.tierCount ?? GFX_TIERS.length;
        this.minTier = opts.minTier ?? 0;                 // best tier allowed
        this.tier = Math.max(this.minTier, opts.tier ?? GFX_DEFAULT_TIER);

        this.WINDOW_MS = 1500;     // one measurement window
        this.SETTLE_MS = 2000;     // ignored after a change / reset
        this.DOWN_RATIO = 0.85;    // achieved/target fps below this = slow window
        this.SEVERE_RATIO = 0.6;   // ...below this, step down without waiting
        this.UP_RATIO = 0.95;      // at or above this = good window
        this.DOWN_WINDOWS = 2;
        this.UP_WINDOWS = 4;
        this.UP_WORK_FRAC = 0.5;   // upgrade only if update+draw used < half the frame budget
        this.FLIP_MS = 12000;      // dropping out of a tier this soon after entering it = flip-flop
        this.BAN_BASE_MS = 30000;
        this.MAX_STRIKES = 3;
        this.MIN_GAIN = 0.05;      // a step down must improve fps by 5% to count

        this.strikes = new Array(this.tierCount).fill(0);
        this.bannedUntil = new Array(this.tierCount).fill(0);
        this.floorTier = this.tierCount - 1; // cheapest tier allowed (raised by useless steps)
        this.refreshMs = null;     // fastest sustained frame interval seen ≈ display refresh
        this._idleFrames = [];
        this.reset(0);
    }

    // Start measuring from scratch — mission start, tab return, mode switch.
    // Bans and strikes survive (they're about this device, not this level);
    // the useless-step floor doesn't (a different level may well be GPU-bound).
    reset(now) {
        this.settleUntil = now + this.SETTLE_MS;
        this.slowStreak = 0;
        this.goodStreak = 0;
        this.floorTier = this.tierCount - 1;
        this.pendingCheck = null;
        this._clearWindow(now);
    }

    _clearWindow(now) {
        this.winStart = now;
        this.winFrames = [];
        this.winWork = 0;
    }

    // Frames from outside gameplay (menus). Too light to judge quality by,
    // but the cleanest read of the display's refresh rate there is.
    noteIdleFrame(frameMs) {
        if (frameMs > 250) return;
        this._idleFrames.push(frameMs);
        if (this._idleFrames.length < 60) return;
        this._noteRefresh(this._p10(this._idleFrames));
        this._idleFrames = [];
    }

    _p10(frames) {
        const sorted = frames.slice().sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length * 0.1)];
    }

    _noteRefresh(ms) {
        this.refreshMs = this.refreshMs === null ? ms : Math.min(this.refreshMs, ms);
    }

    canUpgradeTo(t, now) {
        return t >= this.minTier && now >= this.bannedUntil[t];
    }

    // One rendered frame: its interval and the CPU ms spent in update+draw.
    // Returns the new tier index when the governor wants a change, else -1.
    sample(frameMs, workMs, now) {
        // A hidden tab or a debugger pause shows up as one huge interval.
        if (frameMs > 250) { this.reset(now); return -1; }
        if (now < this.settleUntil) { this._clearWindow(now); return -1; }
        this.winFrames.push(frameMs);
        this.winWork += workMs;
        if (now - this.winStart < this.WINDOW_MS || this.winFrames.length < 10) return -1;
        const frames = this.winFrames;
        const work = this.winWork / frames.length;
        this._clearWindow(now);
        return this._evaluate(frames, work, now);
    }

    _evaluate(frames, workMs, now) {
        const avgMs = frames.reduce((a, b) => a + b, 0) / frames.length;
        // 10th-percentile interval: on a healthy 60Hz screen most frames hit
        // 16.7ms, so this tracks the refresh rate. A screen capped at 30Hz
        // (battery saver) never shows anything faster than ~33ms — targeting
        // 60 there would grind quality down for nothing. A busy CPU means the
        // slow frames are ours, not the display's, so it doesn't count.
        const p10 = this._p10(frames);
        if (workMs < 0.5 * p10) this._noteRefresh(p10);
        const refresh = this.refreshMs === null ? 1000 / 60 : this.refreshMs;
        const targetMs = Math.max(1000 / 60, Math.min(refresh, 1000 / 24));
        const ratio = targetMs / avgMs; // 1.0 = hitting target

        // Judge the previous step down now that it has had a clean window.
        if (this.pendingCheck) {
            const { from, ratioBefore } = this.pendingCheck;
            this.pendingCheck = null;
            if (ratio < ratioBefore * (1 + this.MIN_GAIN) && ratio < this.UP_RATIO) {
                this.floorTier = from; // cheaper didn't help: go back, stop here
                return this._change(from, now, 'revert');
            }
        }

        if (ratio < this.DOWN_RATIO) {
            this.goodStreak = 0;
            this.slowStreak++;
            const due = ratio < this.SEVERE_RATIO || this.slowStreak >= this.DOWN_WINDOWS;
            if (due && this.tier < this.floorTier) {
                this.pendingCheck = { from: this.tier, ratioBefore: ratio };
                return this._change(this.tier + 1, now, 'down');
            }
            return -1;
        }
        this.slowStreak = 0;

        if (ratio >= this.UP_RATIO && workMs < this.UP_WORK_FRAC * targetMs) {
            this.goodStreak++;
            if (this.goodStreak >= this.UP_WINDOWS && this.tier > this.minTier &&
                this.canUpgradeTo(this.tier - 1, now)) {
                return this._change(this.tier - 1, now, 'up');
            }
        } else {
            this.goodStreak = 0;
        }
        return -1;
    }

    _change(to, now, why) {
        const from = this.tier;
        if (why === 'down' && this.enteredAt !== undefined && this.enteredBy === 'up' &&
            now - this.enteredAt < this.FLIP_MS) {
            // Climbed into `from` and couldn't hold it — that's a flip-flop.
            const s = ++this.strikes[from];
            this.bannedUntil[from] = s >= this.MAX_STRIKES
                ? Infinity
                : now + this.BAN_BASE_MS * Math.pow(2, s - 1);
        }
        this.tier = to;
        this.enteredAt = now;
        this.enteredBy = why;
        this.settleUntil = now + this.SETTLE_MS;
        this.slowStreak = 0;
        this.goodStreak = 0;
        this.lastChange = { from, to, why, at: now };
        return to;
    }
}

const CargoPerfMixin = {
    // Called once from init(), before the first resizeCanvas().
    initGraphics() {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        this._gfxDpr = dpr;
        let mode = 'auto';
        let savedAuto = null;
        try {
            mode = localStorage.getItem('cargoLanderGfx') || 'auto';
            savedAuto = localStorage.getItem('cargoLanderGfxAuto');
        } catch (e) { /* storage blocked — defaults are fine */ }
        if (mode !== 'auto' && !GFX_TIERS.some(t => t.id === mode)) mode = 'auto';
        this.gfxMode = mode;
        // Resume where Auto settled last session (saves re-learning a slow
        // phone every visit), but never start above High — the sharper tiers
        // are earned. Saved as a tier id; an old numeric save is ignored
        // (the tier list grew in v0.27.0 and indices shifted).
        const saved = GFX_TIERS.findIndex(t => t.id === savedAuto);
        const start = saved >= 0 ? Math.max(GFX_DEFAULT_TIER, saved) : GFX_DEFAULT_TIER;
        this.perfGovernor = new QualityGovernor({ minTier: this._bestDistinctTier(window.innerWidth, window.innerHeight), tier: start });
        this.applyGraphicsTier(mode === 'auto' ? start : this._tierIndex(mode));
    },

    _tierIndex(id) {
        const i = GFX_TIERS.findIndex(t => t.id === id);
        return i < 0 ? GFX_DEFAULT_TIER : i;
    },

    applyGraphicsTier(idx) {
        const tier = GFX_TIERS[idx] || GFX_TIERS[GFX_DEFAULT_TIER];
        this.gfxTier = GFX_TIERS.indexOf(tier);
        this.gfx = tier;
        this.renderScale = this.graphicsScaleFor(window.innerWidth, window.innerHeight);
        if (this.canvas) this.resizeCanvas();
    },

    // The current tier's backing-store scale for a viewport — resizeCanvas()
    // re-asks on every resize, since the pixel budget depends on the size.
    graphicsScaleFor(w, h) {
        return gfxScaleFor(this.gfx || GFX_TIERS[GFX_DEFAULT_TIER], w, h, this._gfxDpr || 1);
    },

    // The best tier that actually differs from the one below it on this
    // viewport. On a 1080p screen at 1x, Crisp, Sharp and High are the same
    // frame, so Auto shouldn't "climb" through them (each climb is a canvas
    // reallocation and a risk of a flip-flop ban for nothing).
    _bestDistinctTier(w, h) {
        const dpr = this._gfxDpr || 1;
        const same = (a, b) => gfxScaleFor(a, w, h, dpr) === gfxScaleFor(b, w, h, dpr) && a.postFX === b.postFX && a.starStride === b.starStride;
        let t = 0;
        while (t < GFX_DEFAULT_TIER && same(GFX_TIERS[t], GFX_TIERS[t + 1])) t++;
        return t;
    },

    // From resizeCanvas(): a new viewport can change which tiers are distinct.
    onViewportResize(w, h) {
        const gov = this.perfGovernor;
        if (!gov) return;
        gov.minTier = this._bestDistinctTier(w, h);
        if (this.gfxMode === 'auto' && gov.tier < gov.minTier) { gov.tier = gov.minTier; this.applyGraphicsTier(gov.tier); }
    },

    // Settings → Graphics: 'auto' or a tier id.
    setGraphicsMode(mode) {
        this.gfxMode = mode === 'auto' || GFX_TIERS.some(t => t.id === mode) ? mode : 'auto';
        try { localStorage.setItem('cargoLanderGfx', this.gfxMode); } catch (e) { /* ignore */ }
        if (this.gfxMode === 'auto') {
            this.perfGovernor.tier = Math.max(this.perfGovernor.minTier, this.gfxTier);
            this.perfGovernor.reset(performance.now());
            this.applyGraphicsTier(this.perfGovernor.tier);
        } else {
            this.applyGraphicsTier(this._tierIndex(this.gfxMode));
        }
    },

    // From loop(): one rendered frame. Only gameplay is measured — menus
    // animate little and would teach the governor nothing useful.
    perfSample(frameMs, workMs, now) {
        const gov = this.perfGovernor;
        if (!gov || this.gfxMode !== 'auto') return;
        if (this.gameState !== 'playing' || document.hidden) {
            this._perfIdle = true;
            if (!document.hidden) gov.noteIdleFrame(frameMs);
            return;
        }
        if (this._perfIdle) { this._perfIdle = false; gov.reset(now); return; }
        const next = gov.sample(frameMs, workMs, now);
        if (next < 0) return;
        this.applyGraphicsTier(next);
        try { localStorage.setItem('cargoLanderGfxAuto', GFX_TIERS[next].id); } catch (e) { /* ignore */ }
    },

    // Short label for the FPS stamp, e.g. "AUTO·HIGH 1920×1080" — the size
    // the frame is actually rendered at, before the browser stretches it.
    graphicsLabel() {
        const t = (this.gfx || GFX_TIERS[GFX_DEFAULT_TIER]).label.toUpperCase();
        const res = this.canvas ? ` ${this.canvas.width}×${this.canvas.height}` : '';
        return (this.gfxMode === 'auto' ? `AUTO·${t}` : t) + res;
    },
};

Object.assign(CargoGame.prototype, CargoPerfMixin);
