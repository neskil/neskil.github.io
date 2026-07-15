// Central game state. All logic modules read/write SC.state; only
// render/ui/input touch the DOM, so tests.html can drive the pure logic.
window.SC = window.SC || {};

// Minimal pub/sub so logic modules can notify the UI without touching the DOM
SC.listeners = {};
SC.on = function(ev, fn) { (SC.listeners[ev] = SC.listeners[ev] || []).push(fn); };
SC.emit = function(ev, data) { (SC.listeners[ev] || []).forEach(fn => fn(data)); };

SC.newState = function() {
    SC.state = {
        time: 0,
        money: SC.CONFIG.START_MONEY,
        earnedTotal: 0,
        delivered: 0,
        missed: 0,
        trucksBought: 0,

        nodes: [],          // see map.js makeNode()
        river: null,        // { spine: [{x,y}], halfWidths: [w] }
        edges: [],          // { a, b, len, bridge, cost }

        orders: [],         // see economy.js
        nextOrderIn: 8,
        orderSeq: 0,

        trucks: [],         // see vehicles.js
        jobs: [],           // pending haul jobs

        upgrades: { truckSpeed: 0, factorySpeed: 0 },

        selectedNode: null, // node picked as road start (input.js)
        highlight: null,    // { paths, color, city, until } — order route overlay
        gameStarted: false
    };
    return SC.state;
};

SC.truckSpeed = function() {
    const u = SC.CONFIG.UPGRADES.truckSpeed;
    return SC.CONFIG.TRUCK_SPEED * (1 + u.boost * SC.state.upgrades.truckSpeed);
};

SC.craftTime = function() {
    const u = SC.CONFIG.UPGRADES.factorySpeed;
    return SC.CONFIG.CRAFT_TIME / (1 + u.boost * SC.state.upgrades.factorySpeed);
};

SC.upgradePrice = function(key) {
    const u = SC.CONFIG.UPGRADES[key];
    const lvl = SC.state.upgrades[key];
    return lvl >= u.max ? null : Math.round(u.base * Math.pow(u.growth, lvl));
};

SC.truckPrice = function() {
    return Math.round(SC.CONFIG.TRUCK_PRICE *
        Math.pow(SC.CONFIG.TRUCK_PRICE_GROWTH, SC.state.trucksBought));
};
