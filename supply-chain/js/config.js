// Supply Chain Tycoon — constants, materials, recipes, prices
window.SC = window.SC || {};

SC.VERSION = '1.9.0';

SC.CONFIG = {
    WORLD_W: 2200,
    WORLD_H: 1500,
    NODE_MIN_DIST: 170,
    NODE_MARGIN: 80,

    START_MONEY: 1200,
    START_TRUCKS: 2,

    // Credit line: purchases may push the balance negative down to
    // -CREDIT_LIMIT, but debt accrues interest continuously.
    CREDIT_LIMIT: 1500,
    DEBT_INTEREST_PER_MIN: 0.10, // 10% of the outstanding debt per minute

    AUTOSAVE_INTERVAL: 5,        // seconds between autosaves

    ROAD_COST_PER_UNIT: 0.6,
    BRIDGE_MULT: 3,            // river crossings cost extra
    ROAD_REFUND: 0.5,          // fraction returned when demolishing

    TRUCK_PRICE: 500,
    TRUCK_PRICE_GROWTH: 1.35,
    TRUCK_SPEED: 80,           // world units / second

    FACTORY_SITE_PRICE: 700,

    CRAFT_TIME: 4,             // seconds per product at level 0

    // Upgrade tracks: price of level n = base * growth^n. truckCapacity
    // is additive (1 unit per level, i.e. 1 + boost*level) rather than
    // multiplicative like the other two.
    UPGRADES: {
        truckSpeed:    { base: 300, growth: 1.6, boost: 0.25, max: 5, label: 'Truck Speed' },
        factorySpeed:  { base: 280, growth: 1.6, boost: 0.25, max: 5, label: 'Factory Speed' },
        truckCapacity: { base: 450, growth: 1.8, boost: 1,    max: 3, label: 'Truck Capacity' }
    },

    ORDER_INTERVAL: [14, 24],  // seconds between new orders (shrinks as you level)
    ORDER_DEADLINE: [100, 160],// seconds to fulfil
    ORDER_MAX_ACTIVE: 6,
    ORDER_DIST_PAY: 0.35,      // $ per world-unit of factory->city distance
    ORDER_DEPTH_SLACK: 0.5,    // extra deadline fraction per chain tier past 1
    SALVAGE_PAY: 15,           // cargo delivered after its order expired

    // A new locked supplier/factory site activates every N deliveries.
    // New customer DCs (cities) are separate: they unlock on their own
    // timer below, not tied to delivery count, since only HQ takes orders
    // at the start and new demand should feel like it's arriving on its
    // own schedule.
    MILESTONE_EVERY: 3,
    CUSTOMER_SPAWN_FIRST: [50, 70],     // seconds until the 2nd order city appears
    CUSTOMER_SPAWN_INTERVAL: [90, 140], // seconds between further ones

    // Manual placement (unlocked by the 'manualPlacement' research): price
    // to drop a site yourself, at a premium over the free milestone unlocks.
    PLACEMENT_SUPPLIER_PRICE: 900,
    PLACEMENT_FACTORY_MULT: 2.5,  // × FACTORY_SITE_PRICE
    PLACEMENT_MIN_DIST: 110       // looser than generated-map NODE_MIN_DIST
};

// Research tree: one active project at a time, paid upfront, takes `time`
// seconds, then unlocks its effect. `requires` lists prerequisite ids.
// RESEARCH_ORDER fixes menu display order (object key order isn't a
// contract to rely on across engines).
SC.RESEARCH = {
    manualPlacement: {
        name: 'Site Requisition', emoji: '📍', cost: 900, time: 70, requires: [],
        desc: 'Place a supplier or factory anywhere on the map yourself, for a premium.'
    },
    creditLine2: {
        name: 'Credit Line II', emoji: '💳', cost: 700, time: 50, requires: [],
        desc: 'Raises your credit limit by $1,000.', creditBonus: 1000
    },
    creditLine3: {
        name: 'Credit Line III', emoji: '💳', cost: 1800, time: 100, requires: ['creditLine2'],
        desc: 'Raises your credit limit by another $2,000.', creditBonus: 2000
    }
};
SC.RESEARCH_ORDER = ['manualPlacement', 'creditLine2', 'creditLine3'];

// Goods tree. Raw goods come from suppliers; crafted goods are made in a
// factory dedicated to that recipe. Only `orderable` goods appear in city
// orders — intermediates (steel) exist to feed deeper chains. Emoji are
// the primary identity; colors are accents (bars, glows, rings).
SC.GOODS = {
    // raw
    wheat:  { emoji: '🌾', name: 'Wheat',       color: '#d4b45a', raw: true },
    water:  { emoji: '💧', name: 'Water',       color: '#38bdf8', raw: true },
    wool:   { emoji: '🧶', name: 'Wool',        color: '#c4a0a0', raw: true },
    rubber: { emoji: '🛞', name: 'Rubber',      color: '#a78bfa', raw: true },
    ore:    { emoji: '🪨', name: 'Iron ore',    color: '#9aa3ad', raw: true },
    coal:   { emoji: '⚫', name: 'Coal',        color: '#64748b', raw: true },
    chips:  { emoji: '💾', name: 'Electronics', color: '#8fa8bf', raw: true },
    copper: { emoji: '🟠', name: 'Copper',      color: '#c2703d', raw: true },
    // crafted (intermediates feed deeper chains; only `orderable` ones
    // appear in city orders). rubber, chips and steel are each shared by
    // two different recipes below, and the robot chain runs 3 tiers deep
    // (wire -> circuit -> robot) — see README "Goods & recipes".
    steel:   { emoji: '🔩', name: 'Steel',        color: '#cbd5e1', inputs: ['ore', 'coal'], building: 'Smelter' },
    wire:    { emoji: '🧵', name: 'Wire',         color: '#e08a3c', inputs: ['copper', 'rubber'], building: 'Wire mill' },
    circuit: { emoji: '🔌', name: 'Circuit board', color: '#facc15', inputs: ['wire', 'chips'], building: 'Circuit factory' },
    bread:   { emoji: '🍞', name: 'Bread',    color: '#f59e0b', inputs: ['wheat', 'water'], orderable: true, value: 150, building: 'Bakery' },
    shoes:   { emoji: '👟', name: 'Sneakers', color: '#34d399', inputs: ['wool', 'rubber'], orderable: true, value: 230, building: 'Sneaker factory' },
    car:     { emoji: '🚗', name: 'Cars',     color: '#b07cd8', inputs: ['steel', 'chips'], orderable: true, value: 480, building: 'Car factory' },
    robot:   { emoji: '🤖', name: 'Robots',   color: '#94a3b8', inputs: ['circuit', 'steel'], orderable: true, value: 900, building: 'Robot factory' }
};

SC.colorOf = function(item) { return SC.GOODS[item].color; };
SC.nameOf = function(item) { return SC.GOODS[item].name; };
SC.emojiOf = function(item) { return SC.GOODS[item].emoji; };

// Chain depth: raw = 0, bread = 1, car = 2. Deeper chains get more
// deadline slack and pay more.
SC.depthOf = function(item) {
    const g = SC.GOODS[item];
    return g.raw ? 0 : 1 + Math.max(...g.inputs.map(SC.depthOf));
};
