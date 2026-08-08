/**
 * ui/touchpad.js — drag-to-steer pads for Cascade on a phone.
 *
 * The arrow console (`.nudge-pad` in index.html) was built for a mouse and for
 * the turn-based modes, where you line a container up and then commit. Cascade
 * is neither: the container is already falling, every cell of travel is one more
 * tap, and the four buttons that matter are spread across a bar a thumb has to
 * walk. So below the mobile breakpoint the arrows give way to two pads — a large
 * one you drag to steer, a small one you tap to turn.
 *
 * The whole gesture vocabulary:
 *
 *   steer pad   drag   one cell per STEP_PX of travel, per axis, screen-relative
 *               tap    drop it now
 *               hold   fall faster while held
 *   turn pad    tap    a quarter turn
 *               drag   a quarter turn per TURN_PX, so a thumb already on the pad
 *                      can keep turning without lifting off
 *
 * Two things make the drag feel like dragging the container rather than poking
 * at it. Travel is *spent*, not measured: each cell the finger buys moves the
 * anchor with it, so a slow drag across the bay spends cells one at a time and
 * a fast one spends several, and neither drifts. And the axes are independent,
 * so a diagonal drag moves diagonally — the bay is two-dimensional and locking
 * to a dominant axis would make half of it a two-part manoeuvre.
 *
 * Everything is pointer-event based, so a mouse drives the pads exactly as a
 * finger does — which is how you test this without a phone. Nothing here knows
 * what a container is; the pads take callbacks and the mode decides whether the
 * move they ask for is legal.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    /** CSS px of drag that buys one cell. A little under a fingertip's width. */
    const STEP_PX = 26;

    /** CSS px of drag that buys one quarter turn. */
    const TURN_PX = 46;

    /** How many cells one pointer event may spend, so a 500px jump — a dropped
        frame, or coalesced moves — cannot fling the piece across the bay. The
        remainder stays owed and the next event spends it. */
    const MAX_STEPS = 4;

    /** Under this much movement the press was still a press, not a drag. */
    const TAP_SLOP = 12;

    /** A press shorter than this, having not moved, is a tap. */
    const TAP_MS = 260;

    /** Still down and still still after this long: a hold, not a tap. */
    const HOLD_MS = 300;

    /** How far the knob is allowed to follow the finger out of the centre. */
    const KNOB_REACH = 42;

    function clamp(v, limit) { return v < -limit ? -limit : v > limit ? limit : v; }

    /**
     * The half both pads share: pointer capture, the knob that follows the
     * finger, and the tap / hold classification.
     *
     * @param {Element} node the pad
     * @param {{drag: function(number, number): {x: number, y: number},
     *          tap: function=, hold: function(boolean)=}} opts
     *        `drag` is handed the delta since it last consumed anything and
     *        returns how much of it it spent. `hold` is optional; a pad without
     *        one never claims a press as a hold, so a long press stays a tap.
     */
    function bindPad(node, opts) {
        let pointer = null;      // the one pointer this pad is following
        let originX = 0, originY = 0;
        let anchorX = 0, anchorY = 0;
        let downAt = 0;
        let dragged = false;
        let holding = false;
        let holdTimer = 0;

        function knob(dx, dy) {
            node.style.setProperty('--knob-x', clamp(dx, KNOB_REACH) + 'px');
            node.style.setProperty('--knob-y', clamp(dy, KNOB_REACH) + 'px');
        }

        function endHold() {
            if (holdTimer) {
                window.clearTimeout(holdTimer);
                holdTimer = 0;
            }
            if (!holding) return;
            holding = false;
            node.classList.remove('is-holding');
            opts.hold(false);
        }

        function release() {
            pointer = null;
            node.classList.remove('is-active');
            knob(0, 0);
            endHold();
        }

        node.addEventListener('pointerdown', function (e) {
            if (pointer !== null) return;  // one finger owns the pad
            pointer = e.pointerId;
            originX = anchorX = e.clientX;
            originY = anchorY = e.clientY;
            downAt = e.timeStamp;
            dragged = false;
            node.classList.add('is-active');
            // Capture, so a drag that leaves the pad keeps steering instead of
            // stopping dead at the edge — which is most of them, on a pad this
            // size. It also guarantees the matching pointerup.
            if (node.setPointerCapture) node.setPointerCapture(e.pointerId);
            e.preventDefault();

            if (opts.hold) {
                holdTimer = window.setTimeout(function () {
                    holdTimer = 0;
                    if (dragged) return;
                    holding = true;
                    node.classList.add('is-holding');
                    opts.hold(true);
                }, HOLD_MS);
            }
        });

        node.addEventListener('pointermove', function (e) {
            if (e.pointerId !== pointer) return;
            e.preventDefault();

            knob(e.clientX - originX, e.clientY - originY);

            if (!dragged &&
                (Math.abs(e.clientX - originX) > TAP_SLOP ||
                 Math.abs(e.clientY - originY) > TAP_SLOP)) {
                dragged = true;
                endHold();   // it was a drag all along
            }

            const spent = opts.drag(e.clientX - anchorX, e.clientY - anchorY);
            anchorX += spent.x;
            anchorY += spent.y;
        });

        node.addEventListener('pointerup', function (e) {
            if (e.pointerId !== pointer) return;
            // Classified before release(), which ends a hold and would otherwise
            // answer the question after having changed it.
            const tapped = !dragged && !holding && (e.timeStamp - downAt) < TAP_MS;
            release();
            if (tapped && opts.tap) opts.tap();
        });

        ['pointercancel', 'lostpointercapture'].forEach(function (evt) {
            node.addEventListener(evt, function (e) {
                if (e.pointerId !== pointer) return;
                release();
            });
        });

        // A hold that outlives the window's focus would never be let go of.
        window.addEventListener('blur', function () {
            if (pointer !== null) release();
        });
    }

    /**
     * Spend as much of `delta` as buys whole units of `unit`, calling `emit`
     * once per unit, and report back how much was spent.
     */
    function spend(delta, unit, emit, negative, positive) {
        let n = Math.trunc(delta / unit);
        if (n === 0) return 0;
        if (n > MAX_STEPS) n = MAX_STEPS;
        if (n < -MAX_STEPS) n = -MAX_STEPS;

        const dir = n > 0 ? positive : negative;
        for (let i = Math.abs(n); i > 0; i--) emit(dir);
        return n * unit;
    }

    /**
     * The large pad. Directions are the screen-relative ones the mode already
     * speaks: up the screen is away from the camera, which is 'forward'.
     *
     * @param {Element} node
     * @param {{step: function(string), drop: function, soft: function(boolean)}} h
     */
    function bindSteerPad(node, h) {
        bindPad(node, {
            drag: function (dx, dy) {
                return {
                    x: spend(dx, STEP_PX, h.step, 'left', 'right'),
                    y: spend(dy, STEP_PX, h.step, 'forward', 'back')
                };
            },
            tap: h.drop,
            hold: h.soft
        });
    }

    /**
     * The small pad. Rotation is a single bit (see CLAUDE.md), so a drag past
     * the threshold turns once and swallows the rest of the delta rather than
     * spinning the piece for the length of the swipe.
     *
     * @param {Element} node
     * @param {{turn: function}} h
     */
    function bindTurnPad(node, h) {
        bindPad(node, {
            drag: function (dx, dy) {
                if (Math.abs(dx) < TURN_PX && Math.abs(dy) < TURN_PX) return { x: 0, y: 0 };
                h.turn();
                return { x: dx, y: dy };
            },
            tap: h.turn
        });
    }

    Cargo3D.bindSteerPad = bindSteerPad;
    Cargo3D.bindTurnPad = bindTurnPad;
})(window);
