// upgrades.js — Upgrade catalog and definitions
// Load order: before game.js

const upgradeCatalog = [
    { id: 'thrusterEfficiency', name: 'Thruster Efficiency',  desc: 'Reduces fuel consumption by 15% per level.',                       maxLevel: 3, basePrice: 750  },
    { id: 'boostMode',          name: 'Engine Boost',          desc: 'Increases main thruster power by 20% per level.',                  maxLevel: 3, basePrice: 1200  },
    { id: 'magneticDeck',       name: 'Magnetic Deck',         desc: 'Automatically pulls nearby cargo into the basket.',                maxLevel: 2, basePrice: 1800 },
    { id: 'aerodynamics',       name: 'Aerodynamic Coating',   desc: 'Reduces air resistance, increasing top speed and coasting distance.', maxLevel: 3, basePrice: 900  },
    { id: 'hullPlating',        name: 'Hull Plating',          desc: 'Increases lander max integrity and impact resistance.',            maxLevel: 3, basePrice: 600  },
    { id: 'shieldRegen',        name: 'Shield Generator',      desc: 'Slowly regenerates integrity and adds a protective energy bubble.',maxLevel: 2, basePrice: 2250 },
    { id: 'repairKit',          name: 'Field Repair Kit',      desc: 'Unlocks HQ hull repairs, paid from your Mission Deposit. L1 repairs up to 50% hull, L2 up to 70%, L3 up to 90%.', maxLevel: 3, basePrice: 1000 },
    { id: 'fireworkLauncher',   name: 'Firework Launcher',     desc: 'Unlocks left-click celebratory firework shots from the lander.',   maxLevel: 1, basePrice: 8999 },
];
