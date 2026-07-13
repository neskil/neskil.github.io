// upgrades.js — Upgrade catalog and definitions
// Load order: before game.js

const upgradeCatalog = [
    { id: 'thrusterEfficiency', name: 'Thruster Efficiency',  desc: 'Reduces fuel consumption by 15% per level.',                       maxLevel: 3, basePrice: 750  },
    { id: 'boostMode',          name: 'Engine Boost',          desc: 'Increases main thruster power by 20% per level.',                  maxLevel: 3, basePrice: 1200  },
    { id: 'magneticDeck',       name: 'Magnetic Deck',         desc: 'Automatically pulls nearby cargo into the basket.',                maxLevel: 2, basePrice: 1800 },
    { id: 'aerodynamics',       name: 'Aerodynamic Coating',   desc: 'Reduces air resistance, increasing top speed and coasting distance.', maxLevel: 3, basePrice: 900  },
    { id: 'hullPlating',        name: 'Hull Plating',          desc: 'Increases lander max integrity by 10 per level.',                  maxLevel: 3, basePrice: 600  },
    { id: 'shieldRegen',        name: 'Shield Generator',      desc: 'Slowly regenerates integrity and adds a protective energy bubble.',maxLevel: 2, basePrice: 2250 },
    { id: 'hullResistance',     name: 'Hull Resistance',       desc: 'Increases safe impact speed by 5% per level.',                     maxLevel: 3, basePrice: 800  },
    { id: 'autoRepair',         name: 'Auto Repair',           desc: 'Repairs 30/60/90 hull after a 3s delay from taking damage. Bank recharges on respawn.', maxLevel: 3, basePrice: 1000 },
    { id: 'fireworkLauncher',   name: 'Firework Launcher',     desc: 'Unlocks left-click celebratory firework shots from the lander.',   maxLevel: 1, basePrice: 8999 },
];
