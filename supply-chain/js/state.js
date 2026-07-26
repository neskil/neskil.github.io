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
        // Live playing-field size — seeded from the CONFIG base, then grown
        // by bought field expansions (see SC.map.buyLand / WORLD_EXPAND).
        // Read everywhere through SC.worldW()/SC.worldH().
        worldW: SC.CONFIG.WORLD_W,
        worldH: SC.CONFIG.WORLD_H,
        expansions: 0,      // how many field expansions have fired
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

        orders: [],         // see economy.js — a contract is a regular order with `contract: true`
        nextOrderIn: 8,
        orderSeq: 0,
        nextCustomerIn: SC.CONFIG.CUSTOMER_SPAWN_FIRST[0] +
            Math.random() * (SC.CONFIG.CUSTOMER_SPAWN_FIRST[1] - SC.CONFIG.CUSTOMER_SPAWN_FIRST[0]),
        contractOffer: null, // { product, city, qty, payout, deadline, timeLeft } awaiting Accept/Decline
        nextContractIn: SC.CONFIG.CONTRACT_INTERVAL[0] +
            Math.random() * (SC.CONFIG.CONTRACT_INTERVAL[1] - SC.CONFIG.CONTRACT_INTERVAL[0]),
        autoAcceptContracts: false, // player toggle, only effective once 'autoAcceptContracts' is researched

        trucks: [],         // see vehicles.js
        jobs: [],           // pending haul jobs
        yardsBought: 0,
        activeYard: null,   // yard/HQ node new truck purchases station at (main.js sets to HQ)

        upgrades: { truckSpeed: 0, factorySpeed: 0, truckCapacity: 0 },
        research: { completed: {}, active: [], queue: [] }, // active: [{ id, t }, ...] array of active research projects; queue: [id, ...] array of queued research project IDs
        promoUntil: 0,      // sim time the running promotion ends (0 = none)
        promoGood: null,    // target product key for active promotion ('all' or specific good, e.g. 'bread')
        regionsUnlocked: 0, // count of additional regions unlocked (Item 15)
        landBought: 0,      // field expansions bought outright (Land Surveying), for SC.landPrice
        upkeepPaid: 0,      // running total of operating upkeep charged, for the stats/game-over screens
        defaultIn: null,    // default countdown while below -creditLimit (null = safe)
        gameOver: false,    // defaulted — sim frozen, overlay shown
        speed: 1,           // fast-forward multiplier: 1/2/4, see main.js's loop
        congestionEnabled: SC.DIFFICULTIES[difficulty].congestion, // fixed by difficulty, see roads.speedMult (dev panel can override for A/B comparison)

        selectedNode: null, // node picked as road start (input.js)
        highlight: null,    // { paths, color, city, until } — order route overlay
        mode: 'build',      // 'build' (default, tap-to-build) | 'upgrade' | 'inspect'
        placeMode: null,    // { kind: 'supplier'|'factory'|'yard', good } — manual placement (input.js)
        gameStarted: false,
        // Guided first-order tutorial (tutorial.js): 0..N-1 = on that step,
        // -1 = finished or skipped. Persisted so a reload resumes mid-sequence.
        tutorialStep: -1,

        deliveredByProduct: {},  // see stats.js — { goodKey: count }
        moneyHistory: [],        // recent SC.state.money samples, see stats.js tick
        nextStatSampleIn: SC.CONFIG.STATS_SAMPLE_INTERVAL,
        achievements: {},        // { id: true } — see stats.js / SC.ACHIEVEMENTS
        unlockedProducts: {}     // { productKey: time_unlocked_in_seconds }
    };
    return SC.state;
};

// The active difficulty preset (interest, deadlines, grace, fail state).
SC.diff = function() {
    return SC.DIFFICULTIES[SC.state.difficulty] || SC.DIFFICULTIES.normal;
};

// Live playing-field size. Defaults to the CONFIG base until a state
// exists (defensive — some headless tests poke camera/map before
// newState), then tracks SC.state.worldW/worldH as the field expands.
SC.worldW = function() { return (SC.state && SC.state.worldW) || SC.CONFIG.WORLD_W; };
SC.worldH = function() { return (SC.state && SC.state.worldH) || SC.CONFIG.WORLD_H; };

// How far a new pool site may spawn from the existing network (map
// .randomLandSpotNear). Per-difficulty — tighter on Easy, more sprawl on
// Hard — falling back to the CONFIG base if a preset omits it.
SC.nodeMaxSpread = function() {
    const s = SC.diff().nodeSpread;
    return s !== undefined ? s : SC.CONFIG.NODE_MAX_SPREAD;
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

// Seconds on the foreclosure clock once the balance drops past the credit
// limit: the difficulty's grace plus any researched extension.
SC.defaultGrace = function() {
    return SC.diff().defaultGrace + SC.research.graceBonus();
};

// Debt interest rate per minute, after Debt Restructuring's discount.
SC.interestPerMin = function() {
    return (SC.diff().interestPerMin || 0) * SC.research.interestMult();
};

// ── Operating upkeep ($/minute) ───────────────────────────────────
// Everything you own costs something to run: the fleet, each owned
// factory, and each yard past HQ (which is free). Charged continuously in
// economy.tick, so a network built out faster than its revenue slides
// into debt on its own — the pressure the foreclosure fail state needs.
// Zero on Sandbox (upkeepMult 0); cut 40% by Predictive Maintenance.
SC.upkeepPerMin = function() {
    const c = SC.CONFIG;
    const st = SC.state;
    const factories = st.nodes.filter(n => n.kind === 'factory' && n.active && !n.forSale).length;
    const yards = st.nodes.filter(n => n.kind === 'yard').length; // HQ excluded on purpose
    const base = st.trucks.length * c.UPKEEP_PER_TRUCK +
                 factories * c.UPKEEP_PER_FACTORY +
                 yards * c.UPKEEP_PER_YARD;
    const mult = SC.diff().upkeepMult !== undefined ? SC.diff().upkeepMult : 1;
    return base * mult * SC.research.upkeepMult();
};

// Buying the next parcel (Land Surveying). Each purchase makes the next one
// pricier, and a region-tier purchase costs REGION_PRICE_MULT times a field
// one — see SC.map.nextLandKind for which tier is up next. This is the only
// way the map grows; nothing expands for free any more.
SC.landPrice = function() {
    const base = SC.CONFIG.LAND_PRICE *
        Math.pow(SC.CONFIG.LAND_PRICE_GROWTH, SC.state.landBought || 0);
    const mult = (SC.map && SC.map.nextLandKind && SC.map.nextLandKind() === 'region')
        ? (SC.CONFIG.REGION_PRICE_MULT || 1) : 1;
    return Math.round(base * mult);
};

SC.truckSpeed = function() {
    const u = SC.CONFIG.UPGRADES.truckSpeed;
    return SC.CONFIG.TRUCK_SPEED * (1 + u.boost * SC.state.upgrades.truckSpeed);
};

SC.craftTime = function(factory) {
    const u = SC.CONFIG.UPGRADES.factorySpeed;
    const base = SC.CONFIG.CRAFT_TIME / (1 + u.boost * SC.state.upgrades.factorySpeed);
    if (factory && factory.specializedRecipe) {
        return base / (SC.CONFIG.SPECIALIZATION_SPEED_MULT || 1.5);
    }
    return base;
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
