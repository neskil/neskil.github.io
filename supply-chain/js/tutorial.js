// Guided first-order tutorial (PLAN.md Phase 1 item 5).
//
// The help overlay explains the rules but leaves a new player staring at an
// empty map wondering what to tap first. This walks them through the one
// sequence that makes the game click — wire the bakery to its two suppliers,
// link it to HQ, watch a truck fill the first order — by naming the exact next
// tap and pointing at the nodes it means.
//
// Pure logic: it decides *what* the current step is and *which nodes* it points
// at, and never touches the DOM or canvas. ui.js renders the banner and
// render-network.js draws the focus rings/arrows, both by reading `current()`
// and `focus()`. Progress is derived from the same events the rest of the game
// already emits, so a step can't get stuck out of sync with the world — if the
// player builds the road the step is asking for before reading the step, the
// check still passes the moment it re-evaluates.
window.SC = window.SC || {};

SC.tutorial = (function () {
    // Node lookups are re-run per check rather than captured at start: the
    // starter cluster is fixed, but a supplier can be upgraded/replaced and a
    // restored save has entirely different node objects than the ones a
    // captured reference would hold.
    const hq = () => SC.state.nodes.find(n => n.kind === 'city' && n.isHQ);
    const bakery = () => SC.state.nodes.find(n => n.kind === 'factory' && n.active && n.recipe === 'bread');
    const supplier = mat => {
        const f = bakery();
        if (!f) return null;
        // Nearest active supplier of that good — on a fresh map there's exactly
        // one, but after milestone unlocks add more, point at the closest.
        return SC.state.nodes
            .filter(n => n.kind === 'supplier' && n.active && n.mat === mat)
            .sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0] || null;
    };

    const routed = (a, b) => !!(a && b && SC.roads.findPath(a, b));

    // Each step names the tap it wants, the nodes to point at, and the
    // condition that retires it. `done()` states the goal rather than the
    // action, so any route to it counts — `refresh()` re-checks on the events
    // that can change the answer (roads built/demolished, orders filled), never
    // per frame, since the HQ check runs a Dijkstra.
    const STEPS = [
        {
            id: 'wheat',
            text: '🌾 Your bakery needs wheat. Tap the <b>bakery</b>, then the <b>wheat farm</b>, to build a road between them.',
            targets: () => [bakery(), supplier('wheat')],
            // Goal, not action: on the rare starter layout where a third site
            // sits on the straight line between them, the overlap rules
            // (SC.roads.checkSegment) refuse the direct road and the player
            // has to hop through that site — which still counts.
            done: () => routed(bakery(), supplier('wheat'))
        },
        {
            id: 'water',
            text: '💧 Bread needs water too. Now road the <b>bakery</b> to the <b>water pump</b>.',
            targets: () => [bakery(), supplier('water')],
            done: () => routed(bakery(), supplier('water'))
        },
        {
            id: 'hq',
            text: '⭐ Link the <b>bakery</b> to <b>HQ</b> so your trucks have somewhere to deliver the bread.',
            targets: () => [bakery(), hq()],
            done: () => routed(bakery(), hq())
        },
        {
            id: 'deliver',
            text: '🚚 That\'s a supply chain! Trucks dispatch themselves — sit back and watch your first order get filled.',
            targets: () => [],
            done: () => SC.state.delivered > 0
        }
    ];

    // Advance past every satisfied step, not just one: a single road can
    // complete two steps at once (linking the bakery to HQ can also be the
    // step that first routes them), and a restored save can land mid-sequence.
    function refresh() {
        if (!active()) return;
        let moved = false;
        while (SC.state.tutorialStep < STEPS.length && STEPS[SC.state.tutorialStep].done()) {
            SC.state.tutorialStep++;
            moved = true;
        }
        if (!moved) return;
        if (SC.state.tutorialStep >= STEPS.length) finish();
        else SC.emit('tutorialStep', STEPS[SC.state.tutorialStep]);
    }

    function finish() {
        SC.state.tutorialStep = -1;   // -1 = retired, distinct from "at step 0"
        SC.emit('tutorialDone');
    }

    const active = () => SC.state.gameStarted && SC.state.tutorialStep >= 0 &&
                         SC.state.tutorialStep < STEPS.length;

    return {
        // Fresh runs only — a restored save keeps whatever step it saved, and a
        // player who has already finished (or skipped) stays finished.
        start() {
            SC.state.tutorialStep = 0;
            refresh();  // skip any step the starter cluster already satisfies
            if (active()) SC.emit('tutorialStep', STEPS[SC.state.tutorialStep]);
        },
        skip: finish,
        refresh,
        active,
        current: () => (active() ? STEPS[SC.state.tutorialStep] : null),
        // Nodes the current step points at, minus any that don't exist yet.
        focus: () => (active() ? STEPS[SC.state.tutorialStep].targets().filter(Boolean) : []),
        stepCount: STEPS.length,
        stepIndex: () => SC.state.tutorialStep
    };
})();
