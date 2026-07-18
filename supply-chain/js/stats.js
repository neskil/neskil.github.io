// Stats & achievements: purely observational bookkeeping for the Stats
// screen — no gameplay effect, nothing here feeds back into the sim.
// Listens to events other logic modules already emit rather than being
// called directly, so economy/roads/vehicles/research/placement don't
// need to know it exists. Pure logic — no DOM.
window.SC = window.SC || {};

SC.stats = (function() {
    // Career Stats
    const CAREER_KEY = 'scTycoonCareer.v1';
    
    const initialCareer = {
        totalDeliveries: 0,
        totalMoneyEarned: 0,
        totalTrucksBought: 0,
        totalRoadsBuilt: 0,
        totalBridgesBuilt: 0,
        totalFerriesBuilt: 0,
        highScoreCash: 0,
        highScoreDeliveries: 0,
        fastestTime50k: null // null or time in seconds
    };

    let career = Object.assign({}, initialCareer);

    function loadCareer() {
        try {
            const data = JSON.parse(localStorage.getItem(CAREER_KEY));
            if (data) {
                career = Object.assign({}, initialCareer, data);
            }
        } catch (e) {
            // failed to load, fallback to default
        }
    }

    function saveCareer() {
        try {
            localStorage.setItem(CAREER_KEY, JSON.stringify(career));
        } catch (e) {
            // quota/private mode
        }
    }

    function resetCareer() {
        career = Object.assign({}, initialCareer);
        saveCareer();
    }

    function initRun() {
        const st = SC.state;
        if (!st) return;
        st.lastDelivered = st.delivered || 0;
        st.lastEarnedTotal = st.earnedTotal || 0;
        st.lastTrucksBought = st.trucksBought || 0;
    }

    loadCareer();

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
            saveCareer(); // periodically save career stats
        }

        // Live update of Career Stats based on current run progress delta
        if (SC.state && SC.state.gameStarted && !SC.state.gameOver) {
            // totalDeliveries
            const delivered = SC.state.delivered || 0;
            const lastDelivered = SC.state.lastDelivered || 0;
            if (delivered > lastDelivered) {
                career.totalDeliveries += (delivered - lastDelivered);
                SC.state.lastDelivered = delivered;
            }

            // totalMoneyEarned
            const earned = Math.round(SC.state.earnedTotal || 0);
            const lastEarned = Math.round(SC.state.lastEarnedTotal || 0);
            if (earned > lastEarned) {
                career.totalMoneyEarned += (earned - lastEarned);
                SC.state.lastEarnedTotal = earned;
            }

            // totalTrucksBought
            const trucksBought = SC.state.trucksBought || 0;
            const lastTrucks = SC.state.lastTrucksBought || 0;
            if (trucksBought > lastTrucks) {
                career.totalTrucksBought += (trucksBought - lastTrucks);
                SC.state.lastTrucksBought = trucksBought;
            }

            // high scores
            career.highScoreCash = Math.max(career.highScoreCash, Math.round(SC.state.money || 0));
            career.highScoreDeliveries = Math.max(career.highScoreDeliveries, delivered);

            // get 50,000 USD speedrun achievements/times
            if (SC.state.money >= 50000 && SC.state.difficulty !== 'sandbox') {
                if (career.fastestTime50k === null || SC.state.time < career.fastestTime50k) {
                    career.fastestTime50k = SC.state.time;
                }
                
                // Unlock speedrun achievements
                if (SC.state.time <= 300) {
                    unlock('speedRun5');
                }
                if (SC.state.time <= 900) {
                    unlock('speedRun15');
                }
                if (SC.state.time <= 1200) {
                    unlock('speedRun20');
                }
            }

            // check megaEarner achievement
            if (SC.state.money >= 100000) {
                unlock('megaEarner');
            }
        }
    }

    SC.on('roadBuilt', e => {
        if (e.ferry) {
            unlock('firstFerry');
            career.totalFerriesBuilt++;
        } else if (e.bridge) {
            unlock('firstBridge');
            career.totalBridgesBuilt++;
        } else {
            career.totalRoadsBuilt++;
        }
        if (SC.state.edges.length >= 50) unlock('roadBuilder');
        saveCareer();
    });
    SC.on('roadUpgraded', () => unlock('firstHighway'));
    SC.on('sitePlaced', d => { if (d.node.kind === 'junction') unlock('firstJunction'); });
    SC.on('debtRecovered', () => unlock('debtRecovered'));
    SC.on('truckBought', () => { 
        if (SC.state.trucks.length >= 10) unlock('tenTruckFleet'); 
        if (SC.state.trucks.length >= 50) unlock('fiftyTrucks'); 
    });
    SC.on('researchComplete', () => {
        if (SC.RESEARCH_ORDER.every(id => SC.research.isDone(id))) unlock('allResearch');
    });
    SC.on('orderComplete', o => {
        SC.state.deliveredByProduct[o.product] = (SC.state.deliveredByProduct[o.product] || 0) + 1;
        if (o.contract) unlock('firstContract');
        if (SC.state.delivered >= 100) unlock('hundredDeliveries');
    });

    return { recordRoadUse, busiestRoad, unlock, tick, career, saveCareer, resetCareer, initRun };
})();
