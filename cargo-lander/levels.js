// levels.js — Level registry and shared helpers
// Load order: after level1..levelN.js, before audio/shaders/physics/game.js
//
// Each levelN.js calls registerLevel(cfg) to add itself in order.
// game.js reads the global `levels` array and `upgradeCatalog`.

const levels = [];
function registerLevel(cfg) { levels.push(cfg); }

// ── Upgrade catalog ────────────────────────────────────────────────────────
const upgradeCatalog = [
    { id: 'thrusterEfficiency', name: 'Thruster Efficiency',  desc: 'Reduces fuel consumption by 15% per level.',                       maxLevel: 3, basePrice: 500  },
    { id: 'boostMode',          name: 'Engine Boost',          desc: 'Increases main thruster power by 20% per level.',                  maxLevel: 3, basePrice: 800  },
    { id: 'magneticDeck',       name: 'Magnetic Deck',         desc: 'Automatically pulls nearby cargo into the basket.',                maxLevel: 2, basePrice: 1200 },
    { id: 'winchExtender',      name: 'Winch Extender',        desc: 'Increases maximum drone rope length by 50m.',                      maxLevel: 2, basePrice: 600  },
    { id: 'hullPlating',        name: 'Hull Plating',          desc: 'Increases lander max integrity and impact resistance.',            maxLevel: 3, basePrice: 400  },
    { id: 'shieldRegen',        name: 'Shield Generator',      desc: 'Slowly regenerates integrity and adds a protective energy bubble.',maxLevel: 2, basePrice: 1500 },
];

// ── Quest helpers ──────────────────────────────────────────────────────────
// Convenience constructors so level files stay DRY.

function questPrimary(text) {
    return { id: 'primary', text, type: 'primary' };
}
function questNoCrash(reward = 300) {
    return { id: 'no_crash', text: 'Zero crashes', type: 'bonus', reward };
}
function questNoCargoLost(text = 'No cargo lost', reward = 250) {
    return { id: 'no_cargo_lost', text, type: 'bonus', reward };
}
function questQuick(text, timeGoal, reward = 200) {
    return { id: 'quick', text, type: 'bonus', reward, timeGoal };
}
function questSurviveWorm(reward = 500) {
    return { id: 'survive_worm', text: 'Survive the worm', type: 'bonus', reward };
}
