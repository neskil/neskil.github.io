// Supply Chain Tycoon — constants, materials, recipes, prices
window.SC = window.SC || {};

SC.VERSION = '1.30.0';

SC.CONFIG = {
    WORLD_W: 2600,
    WORLD_H: 1800,
    NODE_MIN_DIST: 170,
    NODE_MARGIN: 80,

    START_TRUCKS: 2,

    // Credit line: purchases may push the balance negative down to
    // -CREDIT_LIMIT, but debt accrues interest continuously. Interest can
    // compound the balance BELOW the limit (purchases are blocked there,
    // so it's a death spiral): that starts the default countdown — climb
    // back above -limit within the grace period or the run ends. Interest
    // rate, grace period, deadlines and starting money all come from the
    // difficulty preset (SC.DIFFICULTIES below).
    CREDIT_LIMIT: 1500,

    // Promotions (unlocked by the 'promotions' research): a paid, timed
    // demand burst — orders arrive much faster and the concurrent-order
    // cap rises while it runs. Repeatable, one at a time.
    PROMO_COST: 600,
    PROMO_DURATION: 45,          // seconds per promotion
    PROMO_ORDER_MULT: 0.35,      // order-spawn interval multiplier while active
    PROMO_ORDER_CAP_BONUS: 2,    // extra concurrent orders while active

    AUTOSAVE_INTERVAL: 5,        // seconds between autosaves

    ROAD_COST_PER_UNIT: 0.6,
    BRIDGE_MULT: 3,            // river crossings cost extra
    ROAD_REFUND: 0.5,          // fraction returned when demolishing

    // Ferries: a cheaper-but-slower alternative to a bridge, chosen at
    // build time (toggle in the Shop panel) for any road crossing the
    // river. Half the speed of a normal road, but a much smaller premium
    // than BRIDGE_MULT's 3x. Congestion (if enabled) still applies on
    // top — trucks queueing for the boat is the same mechanic as trucks
    // queueing on a jammed road, just re-used. Can't be paved into a
    // highway (see roads.upgradeQuote).
    FERRY_COST_MULT: 1.4,
    FERRY_SPEED_MULT: 0.5,

    // Truck price ladders PER YARD: the nth truck stationed at a given
    // yard costs base * growth^n, so building a new yard "resets" the
    // ladder there. The counterweight is YARD_PRICE_GROWTH below — each
    // extra yard costs 1.5× the last, so cheap trucks are bought with
    // increasingly expensive yards.
    TRUCK_PRICE: 500,
    TRUCK_PRICE_GROWTH: 1.35,
    TRUCK_SPEED: 80,           // world units / second

    // Road upgrades (research-gated by 'pavedRoads'): a highway edge
    // moves trucks HIGHWAY_SPEED_MULT× faster; upgrade cost scales with
    // length like building does (bridges cost extra again).
    ROAD_UPGRADE_PER_UNIT: 0.9,
    HIGHWAY_SPEED_MULT: 1.6,

    // Congestion (SC.state.congestionEnabled, fixed per difficulty
    // below — see DIFFICULTIES; the ☰-menu Dev tools panel can override
    // it live for comparison): once more than CONGESTION_THRESHOLD trucks share
    // an edge at the same moment, each additional truck slows that edge
    // by CONGESTION_STEP
    // (multiplicative), down to a CONGESTION_FLOOR minimum — never a
    // full stop. Applies to both truck movement and Dijkstra's routing
    // weight, so dispatch naturally prefers a parallel, less-jammed road.
    CONGESTION_THRESHOLD: 2,
    CONGESTION_STEP: 0.18,
    CONGESTION_FLOOR: 0.35,

    // Suppliers hold a finite stock that regenerates over time; trucks
    // wait at an empty supplier until enough stock accumulates. Each
    // supplier can be upgraded individually (tap in Upgrade mode):
    // +CAP_PER_LEVEL capacity and +REGEN_PER_LEVEL regen per level.
    SUPPLIER_STOCK_CAP: 8,
    SUPPLIER_CAP_PER_LEVEL: 4,
    SUPPLIER_REGEN: 0.25,          // units per second at level 0
    SUPPLIER_REGEN_PER_LEVEL: 0.5, // +50% of base regen per level
    SUPPLIER_MAX_LEVEL: 4,
    SUPPLIER_UPGRADE_BASE: 400,
    SUPPLIER_UPGRADE_GROWTH: 1.6,

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
    ORDER_MAX_ACTIVE: 6,       // base cap; +ORDER_PER_CITY per DC beyond HQ
    ORDER_PER_CITY: 2,         // demand scales with the customer network
    ORDER_DIST_PAY: 0.35,      // $ per world-unit of factory->city distance
    ORDER_DEPTH_SLACK: 0.5,    // extra deadline fraction per chain tier past 1
    ORDER_DEPTH_VALUE: 0.25,   // extra payout fraction per chain tier past 1
    SALVAGE_PAY: 15,           // cargo delivered after its order expired

    // Contracts: occasional bulk-order offers at a locked-in premium
    // rate. A card lets you Accept or Decline within CONTRACT_OFFER_EXPIRE
    // before it's withdrawn; accepting turns it into a regular (large)
    // order with a longer deadline. Unlike a normal missed order (just a
    // tally, no cost), failing to deliver the full quantity in time
    // charges a penalty on top — proportional to however many units are
    // still missing, so a near-complete contract stings less than an
    // untouched one. Only one contract (offer or active) at a time.
    CONTRACT_INTERVAL: [150, 240],  // seconds between offer attempts
    CONTRACT_OFFER_EXPIRE: 25,      // seconds to accept before withdrawn
    CONTRACT_QTY: [4, 7],
    CONTRACT_DURATION: [150, 220],  // seconds to fulfil once accepted
    CONTRACT_RATE_BONUS: 1.35,      // locked-in premium over the normal per-unit value
    CONTRACT_PENALTY_MULT: 0.6,     // × missing units' value, charged on failure

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
    PLACEMENT_MIN_DIST: 110,      // looser than generated-map NODE_MIN_DIST

    // Truck yards: not research-gated (a base mechanic, not a premium
    // bailout). HQ always counts as the first yard. Price grows per yard
    // bought, same shape as TRUCK_PRICE/TRUCK_PRICE_GROWTH.
    YARD_PRICE: 1200,
    YARD_PRICE_GROWTH: 1.5
};

// Difficulty presets, chosen on the new-game screen and fixed for the
// run (persisted in the save). Normal is the balance baseline: 15%/min
// interest and 20% shorter order deadlines than the original tuning.
// Easy keeps the pre-1.13 pace; Sandbox never forecloses (noFail) and
// starts rich, for players who just want to build networks. `congestion`
// sets SC.state.congestionEnabled for the whole run — it's purely a
// difficulty trait, not a player-facing toggle (the ☰-menu Dev tools
// panel can still override it live, for A/B comparison during dev).
SC.DIFFICULTIES = {
    easy: {
        label: 'Easy', emoji: '🌱', startMoney: 1500,
        interestPerMin: 0.10, deadlineMult: 1.0, defaultGrace: 90, congestion: false,
        desc: 'Relaxed deadlines, gentle interest, no congestion.'
    },
    normal: {
        label: 'Normal', emoji: '🚚', startMoney: 1200,
        interestPerMin: 0.15, deadlineMult: 0.8, defaultGrace: 60, congestion: true,
        desc: 'Tight deadlines, 15%/min debt interest, road congestion.'
    },
    hard: {
        label: 'Hard', emoji: '🔥', startMoney: 1000,
        interestPerMin: 0.20, deadlineMult: 0.65, defaultGrace: 45, congestion: true,
        desc: 'Brutal deadlines, punishing interest, road congestion.'
    },
    sandbox: {
        label: 'Sandbox', emoji: '🏖️', startMoney: 50000,
        interestPerMin: 0, deadlineMult: 1.5, defaultGrace: 60, noFail: true, congestion: false,
        desc: 'Deep pockets, no interest, no bankruptcy, no congestion.'
    }
};
SC.DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'sandbox'];

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
    },
    pavedRoads: {
        name: 'Asphalt Paving', emoji: '🛣️', cost: 800, time: 60, requires: [],
        desc: 'Upgrade individual roads to highways — trucks drive 60% faster on them.'
    },
    overdrive: {
        name: 'Overdrive Engines', emoji: '⚡', cost: 1600, time: 90, requires: ['pavedRoads'],
        desc: 'Raises the Truck Speed upgrade cap by 3 levels.',
        upgradeMaxBonus: { truckSpeed: 3 }
    },
    fertilizer: {
        name: 'Fertilizer Program', emoji: '🌱', cost: 1000, time: 70, requires: [],
        desc: 'All suppliers regenerate stock 50% faster.',
        supplierRegenBonus: 0.5
    },
    automation: {
        name: 'Factory Automation', emoji: '🦾', cost: 2000, time: 110, requires: ['fertilizer'],
        desc: 'Raises the Factory Speed upgrade cap by 3 levels.',
        upgradeMaxBonus: { factorySpeed: 3 }
    },
    premiumContracts: {
        name: 'Premium Contracts', emoji: '💰', cost: 1400, time: 80, requires: ['creditLine2'],
        desc: 'Negotiate better rates — all order payouts +15%.',
        payoutBonus: 0.15
    },
    rapidExpansion: {
        name: 'Regional Marketing', emoji: '🏙️', cost: 2200, time: 120, requires: ['premiumContracts'],
        desc: 'Word gets around — new customer DCs appear 40% sooner.',
        customerSpawnMult: 0.6
    },
    coldStorage: {
        name: 'Preservatives', emoji: '🧊', cost: 1200, time: 80, requires: ['fertilizer'],
        desc: 'Goods keep longer — order deadlines +25%.',
        deadlineBonus: 0.25
    },
    bulkLogistics: {
        name: 'Bulk Logistics', emoji: '🏗️', cost: 2400, time: 120, requires: ['overdrive'],
        desc: 'Raises the Truck Capacity upgrade cap by 2 levels.',
        upgradeMaxBonus: { truckCapacity: 2 }
    },
    promotions: {
        name: 'Marketing Blitz', emoji: '📣', cost: 1800, time: 100, requires: ['premiumContracts'],
        desc: 'Unlocks paid promotions: a 45s burst of extra orders, repeatable from the Shop.'
    }
};
SC.RESEARCH_ORDER = ['manualPlacement', 'creditLine2', 'pavedRoads', 'fertilizer',
                     'creditLine3', 'premiumContracts', 'overdrive', 'automation', 'coldStorage',
                     'rapidExpansion', 'promotions', 'bulkLogistics'];

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
