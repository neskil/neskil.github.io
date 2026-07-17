// Stats & achievements: purely observational bookkeeping for the Stats
// screen — no gameplay effect, nothing here feeds back into the sim.
// Listens to events other logic modules already emit rather than being
// called directly, so economy/roads/vehicles/research/placement don't
// need to know it exists. Pure logic — no DOM.
window.SC = window.SC || {};

SC.stats = (function() {
    // Called once per truck per road segment it enters (see vehicles.js
    // tick) — accumulates on the edge itself, the same way `level`/`ferry`
    // already ride along on edges, so it persists via save.js for free.
    function recordRoadUse(edge) {
        if (!edge) return;
        edge.trips = (edge.trips || 0) + 1;
    }

    function busiestRoad() {
        let best = null;
        for (const e of SC.state.edges) {
            if (e.trips && (!best || e.trips > best.trips)) best = e;
        }
        return best;
    }

    function unlock(id) {
        if (SC.state.achievements[id]) return; // already have it
        SC.state.achievements[id] = true;
        SC.emit('achievementUnlocked', id);
    }

    // Money-history sampling only; achievement checks below are event-
    // driven (see the SC.on(...) calls), not polled here.
    function tick(dt) {
        SC.state.nextStatSampleIn -= dt;
        if (SC.state.nextStatSampleIn <= 0) {
            SC.state.nextStatSampleIn = SC.CONFIG.STATS_SAMPLE_INTERVAL;
            SC.state.moneyHistory.push(Math.round(SC.state.money));
            if (SC.state.moneyHistory.length > SC.CONFIG.STATS_HISTORY_MAX) SC.state.moneyHistory.shift();
        }
    }

    SC.on('roadBuilt', e => {
        if (e.ferry) unlock('firstFerry');
        else if (e.bridge) unlock('firstBridge');
    });
    SC.on('roadUpgraded', () => unlock('firstHighway'));
    SC.on('sitePlaced', d => { if (d.node.kind === 'junction') unlock('firstJunction'); });
    SC.on('debtRecovered', () => unlock('debtRecovered'));
    SC.on('truckBought', () => { if (SC.state.trucks.length >= 10) unlock('tenTruckFleet'); });
    SC.on('researchComplete', () => {
        if (SC.RESEARCH_ORDER.every(id => SC.research.isDone(id))) unlock('allResearch');
    });
    SC.on('orderComplete', o => {
        SC.state.deliveredByProduct[o.product] = (SC.state.deliveredByProduct[o.product] || 0) + 1;
        if (o.contract) unlock('firstContract');
        if (SC.state.delivered >= 100) unlock('hundredDeliveries');
    });

    return { recordRoadUse, busiestRoad, unlock, tick };
})();
