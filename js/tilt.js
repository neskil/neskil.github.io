// Card tilt + glare. Every card gets a gentle 3D lean and a coloured
// highlight that tracks where the "light" is. Three sources feed it,
// highest-priority first:
//
//   1. Direct interaction — mouse hover or a finger on the card. Always wins.
//   2. Mobile ambient, when nothing is being touched:
//        a) accelerometer tilt, relative to a "neutral" holding angle that is
//           captured on the first reading and then slowly drifts to track
//           wherever the phone actually settles (no hardcoded "held at 45°"
//           assumption, and a deliberate tilt relaxes back to centre after a
//           few seconds); and
//        b) a scroll-linked bend — cards above the viewport's vertical centre
//           tilt one way, cards below the other, flat in the middle — so the
//           grid reads like a gentle concave shelf as you scroll.
//      The two are additive.
//   3. Desktop ambient: cards lean slightly toward the cursor even when it is
//      nowhere near them, fading out as it leaves the window.
//
// Everything is written as CSS custom properties on the card (--rx/--ry tilt,
// --ty lift, --mx/--my glare position, --mag intensity) and interpreted by
// css/cards.css. One rAF loop lerps every card toward its target, so the
// motion stays smooth no matter which source set it.
window.HOME = window.HOME || {};

HOME.tilt = (function () {
    // Per-card tuning. Cards not listed use the default; the two "game" cards
    // sway further, and the CV card is deliberately dry.
    const DEFAULT_TUNING = { maxTilt: 10, lift: -8 };
    const TUNING = {
        'card-cargo-lander': { maxTilt: 15, lift: -12 },
        'card-supply-chain': { maxTilt: 15, lift: -12 },
        'card-cv': { maxTilt: 7, lift: -5 }
    };

    const SCROLL_BEND_FRACTION = 1.4;
    const SCROLL_BEND_POWER = 1.2;
    const BASELINE_HALFLIFE_S = 3;

    // How far the ambient desktop lean can go, and how quickly it falls off
    // with distance from the cursor.
    const AMBIENT_MAX_TILT = 4;
    const AMBIENT_FALLOFF_PX = 900;

    const cardState = new Map(); // card -> state object

    let lastBeta = null, lastGamma = null;
    let baselineBeta = null, baselineGamma = null;
    let lastTick = null;
    let isTouch = false;

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    // ── Pure geometry (exercised by tests.html) ──────────────────────────

    // Tilt and glare from a point on the card, given as 0..1 fractions of its
    // width and height. Centre is neutral; the glare tracks the point but is
    // kept 5% clear of the edges so it never sits half outside the card.
    function tiltFromPoint(px, py, maxTilt) {
        px = clamp(px, 0, 1);
        py = clamp(py, 0, 1);
        const rx = clamp((0.5 - py) * maxTilt * 2, -maxTilt, maxTilt);
        const ry = clamp((px - 0.5) * maxTilt * 2, -maxTilt, maxTilt);
        return {
            rx, ry,
            mx: 5 + px * 90,
            my: 5 + py * 90,
            mag: clamp((Math.abs(rx) + Math.abs(ry)) / (2 * maxTilt), 0, 1)
        };
    }

    // The scroll-linked shelf bend. `norm` is where the card's centre sits
    // relative to the viewport's, -1 (top) to 1 (bottom); easing it keeps the
    // middle of the screen flatter than a straight ramp would.
    function scrollBend(cardCenterY, viewH, maxTilt) {
        const viewportCenter = viewH / 2;
        const norm = clamp((cardCenterY - viewportCenter) / Math.max(viewportCenter, 1), -1, 1);
        const eased = Math.sign(norm) * Math.pow(Math.abs(norm), SCROLL_BEND_POWER);
        return { norm, eased, bend: eased * maxTilt * SCROLL_BEND_FRACTION };
    }

    // ── Per-card state ───────────────────────────────────────────────────

    function stateFor(card) {
        let state = cardState.get(card);
        if (!state) {
            const tuning = TUNING[card.id] || DEFAULT_TUNING;
            state = {
                maxTilt: tuning.maxTilt,
                lift: tuning.lift,
                hovered: false,
                targetRx: 0, targetRy: 0, targetTy: 0,
                targetMx: 50, targetMy: 50, targetMag: 0,
                currentRx: 0, currentRy: 0, currentTy: 0,
                currentMx: 50, currentMy: 50, currentMag: 0
            };
            cardState.set(card, state);
        }
        return state;
    }

    function applyVars(card, s) {
        card.style.setProperty('--rx', s.currentRx.toFixed(2) + 'deg');
        card.style.setProperty('--ry', s.currentRy.toFixed(2) + 'deg');
        card.style.setProperty('--ty', s.currentTy.toFixed(1) + 'px');
        card.style.setProperty('--mx', s.currentMx.toFixed(1) + '%');
        card.style.setProperty('--my', s.currentMy.toFixed(1) + '%');
        card.style.setProperty('--mag', s.currentMag.toFixed(2));
    }

    function attach(card) {
        const state = stateFor(card);

        function fromPoint(clientX, clientY) {
            if (card.classList.contains('is-open')) return;
            const rect = card.getBoundingClientRect();
            const t = tiltFromPoint(
                (clientX - rect.left) / rect.width,
                (clientY - rect.top) / rect.height,
                state.maxTilt
            );
            state.targetRx = t.rx;
            state.targetRy = t.ry;
            state.targetMx = t.mx;
            state.targetMy = t.my;
            state.targetMag = t.mag;
            state.targetTy = state.lift;
        }

        function activate() {
            if (card.classList.contains('is-open')) return;
            state.hovered = true;
            HOME.background.activateCardTheme(card.id);
        }

        function release() {
            if (card.classList.contains('is-open')) return;
            state.hovered = false;
        }

        card.addEventListener('mouseenter', activate);
        card.addEventListener('mousemove', (e) => fromPoint(e.clientX, e.clientY));
        card.addEventListener('mouseleave', release);

        card.addEventListener('touchstart', (e) => {
            activate();
            if (e.touches[0]) fromPoint(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        card.addEventListener('touchmove', (e) => {
            if (e.touches[0]) fromPoint(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        card.addEventListener('touchend', release);
        card.addEventListener('touchcancel', release);
    }

    // ── Ambient loop ─────────────────────────────────────────────────────

    function onOrientation(e) {
        if (e.beta === null || e.gamma === null) return;
        lastBeta = e.beta;
        lastGamma = e.gamma;
        if (baselineBeta === null) { baselineBeta = e.beta; baselineGamma = e.gamma; }
    }

    function ambientTick(now) {
        const dt = lastTick === null ? 0 : Math.min((now - lastTick) / 1000, 0.25);
        lastTick = now;

        const pointer = HOME.background.pointer;
        const isMobileView = isTouch || window.innerWidth <= 640;

        let deltaBeta = 0, deltaGamma = 0;
        if (isMobileView && lastBeta !== null) {
            if (dt > 0) {
                const drift = 1 - Math.pow(0.5, dt / BASELINE_HALFLIFE_S);
                baselineBeta += (lastBeta - baselineBeta) * drift;
                baselineGamma += (lastGamma - baselineGamma) * drift;
            }
            deltaBeta = clamp(lastBeta - baselineBeta, -45, 45);
            deltaGamma = clamp(lastGamma - baselineGamma, -45, 45);
        }

        document.querySelectorAll('.card').forEach((card) => {
            if (card.classList.contains('is-open')) return;
            const state = stateFor(card);
            const maxTilt = state.maxTilt;
            const rect = card.getBoundingClientRect();

            if (!state.hovered) {
                if (isMobileView) {
                    const accelRx = clamp(deltaBeta * -0.3, -maxTilt, maxTilt);
                    const accelRy = clamp(deltaGamma * 0.3, -maxTilt, maxTilt);
                    const b = scrollBend(rect.top + rect.height / 2, window.innerHeight, maxTilt);

                    state.targetRx = clamp(accelRx + b.bend, -16, 16);
                    state.targetRy = accelRy;
                    state.targetTy = Math.abs(b.eased) * -3;
                    state.targetMag = clamp((Math.abs(state.targetRx) + Math.abs(state.targetRy)) / 20, 0, 1);
                    state.targetMx = clamp(50 + deltaGamma * 1.1, 5, 95);
                    state.targetMy = clamp(50 + deltaBeta * 1.1 + b.norm * 35, 5, 95);
                } else if (pointer.active && pointer.presence > 0.001 && pointer.smoothX !== null) {
                    const cardCenterX = rect.left + rect.width / 2;
                    const cardCenterY = rect.top + rect.height / 2;
                    const dx = pointer.smoothX - cardCenterX;
                    const dy = pointer.smoothY - cardCenterY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const ambientMax = Math.min(AMBIENT_MAX_TILT, maxTilt * 0.4);
                    const factor = clamp(1 - dist / AMBIENT_FALLOFF_PX, 0.15, 1.0) * pointer.presence;

                    state.targetRx = clamp((-dy / 450) * ambientMax * factor, -ambientMax, ambientMax);
                    state.targetRy = clamp((dx / 450) * ambientMax * factor, -ambientMax, ambientMax);
                    state.targetTy = 0;
                    state.targetMag = clamp((Math.abs(state.targetRx) + Math.abs(state.targetRy)) / (2 * maxTilt), 0, 0.35) * pointer.presence;
                    state.targetMx = clamp(50 + (dx / rect.width) * 35, 8, 92);
                    state.targetMy = clamp(50 + (dy / rect.height) * 35, 8, 92);
                } else {
                    // Pointer has left the window (and the delay expired):
                    // settle back to flat with the glare centred.
                    state.targetRx = 0;
                    state.targetRy = 0;
                    state.targetTy = 0;
                    state.targetMx = 50;
                    state.targetMy = 50;
                    state.targetMag = 0;
                }
            }

            // On-screen tracking is crisp and responsive; the slow decay is
            // strictly for leaving the window.
            const isOffScreenDecay = !pointer.active && !state.hovered;
            const lerp = state.hovered ? 0.18 : (isOffScreenDecay ? 0.04 : 0.15);
            state.currentRx += (state.targetRx - state.currentRx) * lerp;
            state.currentRy += (state.targetRy - state.currentRy) * lerp;
            state.currentTy += (state.targetTy - state.currentTy) * lerp;
            state.currentMx += (state.targetMx - state.currentMx) * lerp;
            state.currentMy += (state.targetMy - state.currentMy) * lerp;
            state.currentMag += (state.targetMag - state.currentMag) * lerp;

            applyVars(card, state);
        });

        requestAnimationFrame(ambientTick);
    }

    function init() {
        isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        document.querySelectorAll('.card').forEach(attach);
        requestAnimationFrame(ambientTick);

        if (!window.DeviceOrientationEvent) return;

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires a user gesture; piggyback on the first touch
            // anywhere on the page.
            document.addEventListener('touchend', function requestOnce() {
                DeviceOrientationEvent.requestPermission()
                    .then(state => {
                        if (state === 'granted') window.addEventListener('deviceorientation', onOrientation);
                    })
                    .catch(() => {});
            }, { once: true });
        } else {
            window.addEventListener('deviceorientation', onOrientation);
        }
    }

    return { init, clamp, tiltFromPoint, scrollBend, TUNING, DEFAULT_TUNING };
})();
