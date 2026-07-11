// upgrades.js — Upgrade catalog and definitions
// Load order: before game.js

const upgradeCatalog = [
    { id: 'thrusterEfficiency', name: 'Thruster Efficiency',  desc: 'Reduces fuel consumption by 15% per level.',                       maxLevel: 3, basePrice: 500  },
    { id: 'boostMode',          name: 'Engine Boost',          desc: 'Increases main thruster power by 20% per level.',                  maxLevel: 3, basePrice: 800  },
    { id: 'magneticDeck',       name: 'Magnetic Deck',         desc: 'Automatically pulls nearby cargo into the basket.',                maxLevel: 2, basePrice: 1200 },
    { id: 'winchExtender',      name: 'Winch Extender',        desc: 'Increases maximum drone rope length by 50m.',                      maxLevel: 2, basePrice: 600  },
    { id: 'hullPlating',        name: 'Hull Plating',          desc: 'Increases lander max integrity and impact resistance.',            maxLevel: 3, basePrice: 400  },
    { id: 'shieldRegen',        name: 'Shield Generator',      desc: 'Slowly regenerates integrity and adds a protective energy bubble.',maxLevel: 2, basePrice: 1500 },
];
