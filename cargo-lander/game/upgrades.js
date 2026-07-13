// upgrades.js — Upgrade catalog and definitions
// Load order: before game.js

const upgradeCatalog = [
    { id: 'thrusterEfficiency', name: 'Thruster Efficiency',  desc: 'Reduces fuel consumption by 15% per level.',                                           maxLevel: 4, basePrice: 800,  category: 'Propulsion', icon: '💨' },
    { id: 'boostMode',          name: 'Engine Boost',          desc: 'Increases main thruster power by 20% per level.',                                      maxLevel: 5, basePrice: 1000, category: 'Propulsion', icon: '🚀' },
    { id: 'aerodynamics',       name: 'Aerodynamic Coating',   desc: 'Reduces air resistance, improving top speed and coasting distance.',                   maxLevel: 4, basePrice: 800,  category: 'Propulsion', icon: '🌬️' },
    { id: 'magneticDeck',       name: 'Magnetic Deck',         desc: 'Increases magnetic pull strength and range on nearby cargo by 20% per level.',          maxLevel: 4, basePrice: 1500, category: 'Utility',    icon: '🧲' },
    { id: 'fireworkLauncher',   name: 'Firework Launcher',     desc: 'Unlocks left-click celebratory firework shots from the lander.',                       maxLevel: 1, basePrice: 8999, category: 'Utility',    icon: '🎆' },
    { id: 'hullPlating',        name: 'Hull Plating',          desc: 'Increases maximum hull integrity by 10 points per level.',                             maxLevel: 5, basePrice: 500,  category: 'Defense',    icon: '🛡️' },
    { id: 'shieldRegen',        name: 'Shield Generator',      desc: 'Adds 50 points of regenerative shielding per level. Recharges after a 5-second delay.',maxLevel: 4, basePrice: 2000, category: 'Defense',    icon: '🔮' },
    { id: 'hullResistance',     name: 'Hull Resistance',       desc: 'Increases maximum safe landing impact speed by 5% per level.',                         maxLevel: 5, basePrice: 700,  category: 'Defense',    icon: '🧱' },
    { id: 'autoRepair',         name: 'Auto Repair',           desc: 'Provides 30 points of automated hull repair per level. Recharges upon respawn.',       maxLevel: 4, basePrice: 1200, category: 'Defense',    icon: '🔧' },
];
