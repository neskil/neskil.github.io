// Central game state. All logic modules read/write SC.state; only
// render/ui/input touch the DOM, so tests.html can drive the pure logic.
window.SC = window.SC || {};

// Minimal pub/sub so logic modules can notify the UI without touching the DOM
SC.listeners = {};
SC.on = function(ev, fn) { (SC.listeners[ev] = SC.listeners[ev] || []).push(fn); };
SC.emit = function(ev, data) { (SC.listeners[ev] || []).forEach(fn => fn(data)); };

// `difficulty` is fixed for the run: it sets starting money here and
// interest/deadline/grace modifiers via SC.diff() everywhere else.
SC.newState = function(difficulty) {
    if (!SC.DIFFICULTIES[difficulty]) difficulty = 'normal';
    SC.state = {
        difficulty,
        seed: null,         // world seed, set by map.generateWorld(); shareable via ?seed=
        time: 0,
        money: SC.DIFFICULTIES[difficulty].startMoney,
        earnedTotal: 0,
        interestPaid: 0,
        delivered: 0,
        missed: 0,
        trucksBought: 0,
        paused: false,      // menu open — sim frozen, not persisted

        nodes: [],          // see map.js makeNode()
        river: null,        // { spine: [{x,y}], halfWidths: [w] }
        edges: [],          // { a, b, len, bridge, cost }

        orders: [],         // see economy.js
        nextOrderIn: 8,
        orderSeq: 0,
        nextCustomerIn: SC.CONFIG.CUSTOMER_SPAWN_FIRST[0] +
            Math.random() * (SC.CONFIG.CUSTOMER_SPAWN_FIRST[1] - SC.CONFIG.CUSTOMER_SPAWN_FIRST[0]),

        trucks: [],         // see vehicles.js
        jobs: [],           // pending haul jobs
        yardsBought: 0,
        activeYard: null,   // yard/HQ node new truck purchases station at (main.js sets to HQ)

        upgrades: { truckSpeed: 0, factorySpeed: 0, truckCapacity: 0 },
        research: { completed: {}, active: null }, // active: { id, t } elapsed seconds
        promoUntil: 0,      // sim time the running promotion ends (0 = none)
        defaultIn: null,    // default countdown while below -creditLimit (null = safe)
        gameOver: false,    // defaulted — sim frozen, overlay shown
        speed: 1,           // fast-forward multiplier: 1/2/4, see main.js's loop

        selectedNode: null, // node picked as road start (input.js)
        highlight: null,    // { paths, color, city, until } — order route overlay
        mode: 'build',      // 'build' (default, tap-to-build) | 'upgrade' | 'inspect'
        placeMode: null,    // { kind: 'supplier'|'factory'|'yard', good } — manual placement (input.js)
        gameStarted: false
    };
    return SC.state;
};

// The active difficulty preset (interest, deadlines, grace, fail state).
SC.diff = function() {
    return SC.DIFFICULTIES[SC.state.difficulty] || SC.DIFFICULTIES.normal;
};

// Purchases may dip into the credit line: affordable as long as the
// resulting balance stays above -CREDIT_LIMIT (raised by completed
// creditBonus research). Debt accrues interest (see economy.tick).
SC.creditLimit = function() {
    return SC.CONFIG.CREDIT_LIMIT + SC.research.creditBonus();
};
SC.canAfford = function(cost) {
    return SC.state.money - cost >= -SC.creditLimit();
};

SC.truckSpeed = function() {
    const u = SC.CONFIG.UPGRADES.truckSpeed;
    return SC.CONFIG.TRUCK_SPEED * (1 + u.boost * SC.state.upgrades.truckSpeed);
};

SC.craftTime = function() {
    const u = SC.CONFIG.UPGRADES.factorySpeed;
    return SC.CONFIG.CRAFT_TIME / (1 + u.boost * SC.state.upgrades.factorySpeed);
};

SC.truckCapacity = function() {
    const u = SC.CONFIG.UPGRADES.truckCapacity;
    return 1 + u.boost * SC.state.upgrades.truckCapacity;
};

// Upgrade level cap: config max plus any research upgradeMaxBonus
// (e.g. Overdrive Engines raises truckSpeed's cap by 3).
SC.upgradeMax = function(key) {
    return SC.CONFIG.UPGRADES[key].max + SC.research.upgradeMaxBonus(key);
};

SC.upgradePrice = function(key) {
    const u = SC.CONFIG.UPGRADES[key];
    const lvl = SC.state.upgrades[key];
    return lvl >= SC.upgradeMax(key) ? null : Math.round(u.base * Math.pow(u.growth, lvl));
};

// Trucks whose home is this yard — the per-yard price ladder's rung.
SC.trucksAtYard = function(yard) {
    return SC.state.trucks.filter(t => t.homeYard === yard).length;
};

// Truck price ladders per yard: a new yard resets the ladder (yards
// themselves get pricier via yardPrice, which is the balance lever).
// Pass the yard the truck would station at; defaults to the same
// resolution buyTruck uses (active yard, falling back to HQ).
SC.truckPrice = function(yard) {
    if (!yard) {
        yard = SC.isYard(SC.state.activeYard) ? SC.state.activeYard
             : (SC.state.nodes.find(n => n.isHQ) || SC.state.nodes[0]);
    }
    return Math.round(SC.CONFIG.TRUCK_PRICE *
        Math.pow(SC.CONFIG.TRUCK_PRICE_GROWTH, SC.trucksAtYard(yard)));
};

// ── Suppliers: finite, regenerating, upgradable stock ─────
SC.supplierCap = function(n) {
    return SC.CONFIG.SUPPLIER_STOCK_CAP + SC.CONFIG.SUPPLIER_CAP_PER_LEVEL * (n.level || 0);
};

SC.supplierRegen = function(n) {
    return SC.CONFIG.SUPPLIER_REGEN *
        (1 + SC.CONFIG.SUPPLIER_REGEN_PER_LEVEL * (n.level || 0)) *
        (1 + SC.research.supplierRegenBonus());
};

SC.supplierUpgradePrice = function(n) {
    if ((n.level || 0) >= SC.CONFIG.SUPPLIER_MAX_LEVEL) return null;
    return Math.round(SC.CONFIG.SUPPLIER_UPGRADE_BASE *
        Math.pow(SC.CONFIG.SUPPLIER_UPGRADE_GROWTH, n.level || 0));
};

SC.yardPrice = function() {
    return Math.round(SC.CONFIG.YARD_PRICE *
        Math.pow(SC.CONFIG.YARD_PRICE_GROWTH, SC.state.yardsBought));
};

// HQ always counts as a yard, plus any purchased 'yard' nodes.
SC.isYard = function(node) {
    return !!node && (node.isHQ || node.kind === 'yard');
};
