// Supply Chain Tycoon — constants, materials, recipes, prices
window.SC = window.SC || {};

SC.VERSION = '1.2.0';

SC.CONFIG = {
    WORLD_W: 2200,
    WORLD_H: 1500,
    NODE_MIN_DIST: 170,
    NODE_MARGIN: 80,

    START_MONEY: 1200,
    START_TRUCKS: 2,

    ROAD_COST_PER_UNIT: 0.6,
    BRIDGE_MULT: 3,            // river crossings cost extra
    ROAD_REFUND: 0.5,          // fraction returned when demolishing

    TRUCK_PRICE: 500,
    TRUCK_PRICE_GROWTH: 1.35,
    TRUCK_SPEED: 80,           // world units / second

    FACTORY_SITE_PRICE: 700,

    CRAFT_TIME: 4,             // seconds per product at level 0

    // Upgrade tracks: price of level n = base * growth^n
    UPGRADES: {
        truckSpeed:   { base: 300, growth: 1.6, boost: 0.25, max: 5, label: 'Truck Speed' },
        factorySpeed: { base: 280, growth: 1.6, boost: 0.25, max: 5, label: 'Factory Speed' }
    },

    ORDER_INTERVAL: [14, 24],  // seconds between new orders (shrinks as you level)
    ORDER_DEADLINE: [100, 160],// seconds to fulfil
    ORDER_MAX_ACTIVE: 6,
    ORDER_DIST_PAY: 0.35,      // $ per world-unit of factory->city distance
    ORDER_DEPTH_SLACK: 0.5,    // extra deadline fraction per chain tier past 1
    SALVAGE_PAY: 15,           // cargo delivered after its order expired

    // A new locked site activates every N deliveries
    MILESTONE_EVERY: 3
};

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
    // crafted
    steel:  { emoji: '🔩', name: 'Steel',    color: '#cbd5e1', inputs: ['ore', 'coal'], building: 'Smelter' },
    bread:  { emoji: '🍞', name: 'Bread',    color: '#f59e0b', inputs: ['wheat', 'water'], orderable: true, value: 150, building: 'Bakery' },
    shoes:  { emoji: '👟', name: 'Sneakers', color: '#34d399', inputs: ['wool', 'rubber'], orderable: true, value: 230, building: 'Sneaker factory' },
    car:    { emoji: '🚗', name: 'Cars',     color: '#b07cd8', inputs: ['steel', 'chips'], orderable: true, value: 480, building: 'Car factory' }
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
