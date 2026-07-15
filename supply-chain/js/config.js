// Supply Chain Tycoon — constants, materials, recipes, prices
window.SC = window.SC || {};

SC.VERSION = '1.0.0';

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
    ORDER_BASE_PAY: 150,       // per unit, plus distance bonus
    ORDER_DIST_PAY: 0.35,      // $ per world-unit of factory->city distance
    SALVAGE_PAY: 15,           // cargo delivered after its order expired

    // A new locked site activates every N deliveries
    MILESTONE_EVERY: 4
};

// Raw materials (muted tones) and products (vivid tones), matching the
// visual language of the original ambient simulation.
SC.MATERIALS = {
    red:    { color: '#c4a0a0', name: 'Red ore' },
    blue:   { color: '#8fa8bf', name: 'Blue ore' },
    yellow: { color: '#bfb87a', name: 'Yellow ore' }
};

SC.PRODUCTS = {
    purple: { color: '#b07cd8', name: 'Purple widgets', inputs: ['red', 'blue'] },
    green:  { color: '#34d399', name: 'Green gadgets',  inputs: ['yellow', 'blue'] },
    orange: { color: '#f59e0b', name: 'Orange gizmos',  inputs: ['red', 'yellow'] }
};

SC.colorOf = function(item) {
    return (SC.MATERIALS[item] || SC.PRODUCTS[item]).color;
};
SC.nameOf = function(item) {
    return (SC.MATERIALS[item] || SC.PRODUCTS[item]).name;
};
