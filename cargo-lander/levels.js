// CargoLander - Game Core Loop & Renderer
const levels = [
    {
        name: "L1: Local Distribution",
        missionTitle: "Local Distribution Contract",
        description: "Transport standard packages to the Delivery Pad. Fly carefully — tilt too much and cargo will slide off!",
        gravity: 0.15,
        wind: 0,
        terrainType: "flat",
        padScale: 1.5,
        targetCargo: 2,
        budget: 1000,
        timeLimit: 180,
        allowedTypes: ["normal"],
        deliveryHubs: [
            { x: 750, color: "#38bdf8", type: "normal", name: "Hub Alpha" }
        ],
        hint: "Tip: Land slowly (< 2.0 m/s) and return to HQ to extract.",
        palette: {
            skyTop: '#04071a', skyMid: '#0a1628', skyBot: '#0d2010',
            terrainFill: '#0a1a08', rockEdge: '#4ade80', rockGlow: 'rgba(74,222,128,',
            fog: 'rgba(74,222,128,0.04)',
        },
        quests: [
            { id: 'primary',       text: 'Deliver 2 cargo to Hub Alpha',   type: 'primary' },
            { id: 'no_crash',      text: 'Zero crashes',                   type: 'bonus', reward: 300 },
            { id: 'quick',         text: 'Finish with 1+ min remaining',   type: 'bonus', reward: 200, timeGoal: 60 },
        ]
    },
    {
        name: "L2: Cross-Dock Sorting",
        missionTitle: "Cross-Dock Sorting Contract",
        description: "Sort the cargo. Normal packages → Main Processing. Fragile (red) → Fragile Handling. Don't drop fragile cargo!",
        gravity: 0.15,
        wind: 0,
        terrainType: "canyon",
        padScale: 1.2,
        targetCargo: 2,
        budget: 1200,
        timeLimit: 240,
        allowedTypes: ["normal", "red"],
        deliveryHubs: [
            { x: 500, color: "#38bdf8", type: "normal", name: "Main Processing" },
            { x: 800, color: "#ef4444", type: "red", name: "Fragile Handling" }
        ],
        hint: "Sort correctly and return to HQ to extract.",
        palette: {
            skyTop: '#120a02', skyMid: '#1e1005', skyBot: '#2e1a06',
            terrainFill: '#1a0f04', rockEdge: '#d97706', rockGlow: 'rgba(217,119,6,',
            fog: 'rgba(217,119,6,0.06)',
        },
        quests: [
            { id: 'primary',         text: 'Sort & deliver 2 cargo',       type: 'primary' },
            { id: 'no_cargo_lost',   text: 'No cargo lost',                type: 'bonus', reward: 250 },
            { id: 'no_crash',        text: 'Zero crashes',                  type: 'bonus', reward: 300 },
        ]
    },
    {
        name: "L3: Gale-Force Winds",
        missionTitle: "High-Altitude Wind Contract",
        description: "Strong crosswinds push your lander and cargo. Compensate by thrusting into the wind.",
        gravity: 0.15,
        wind: 0.08,
        terrainType: "mountain",
        padScale: 0.85,
        targetCargo: 2,
        budget: 1500,
        timeLimit: 200,
        allowedTypes: ["normal"],
        deliveryHubs: [
            { x: 650, color: "#38bdf8", type: "normal", name: "Peak Station" }
        ],
        hint: "Tilt into the wind. Return to HQ to extract.",
        palette: {
            skyTop: '#020810', skyMid: '#061828', skyBot: '#0a1e2e',
            terrainFill: '#08121c', rockEdge: '#7dd3fc', rockGlow: 'rgba(125,211,252,',
            fog: 'rgba(125,211,252,0.06)',
        },
        quests: [
            { id: 'primary',    text: 'Deliver 2 cargo to Peak Station', type: 'primary' },
            { id: 'no_crash',   text: 'Zero crashes',                    type: 'bonus', reward: 400 },
            { id: 'quick',      text: 'Finish with 30+ sec remaining',   type: 'bonus', reward: 200, timeGoal: 30 },
        ]
    },
    {
        name: "L4: Gravity Anomaly",
        missionTitle: "Anomaly Zone Delivery",
        description: "A gravitational vortex is pulling you in. Counter the force and sort red/blue cargo to their correct hubs.",
        gravity: 0.15,
        wind: 0,
        terrainType: "cave",
        padScale: 0.70,
        targetCargo: 2,
        budget: 2000,
        timeLimit: 180,
        allowedTypes: ["red", "blue"],
        deliveryHubs: [
            { x: 750, color: "#ef4444", type: "red", name: "Sector 4" },
            { x: 900, color: "#3b82f6", type: "blue", name: "Deep Storage" }
        ],
        gravityWell: { x: 500, y: 400, strength: 0.8, radius: 200, orbitRadius: 200 },
        hint: "Avoid the vortex! Return to HQ to extract.",
        palette: {
            skyTop: '#0e0403', skyMid: '#1a0602', skyBot: '#2a0a04',
            terrainFill: '#120402', rockEdge: '#f97316', rockGlow: 'rgba(249,115,22,',
            fog: 'rgba(249,115,22,0.08)',
        },
        quests: [
            { id: 'primary',         text: 'Deliver red & blue cargo',    type: 'primary' },
            { id: 'no_cargo_lost',   text: 'No cargo sucked in',          type: 'bonus', reward: 350 },
            { id: 'no_crash',        text: 'Zero crashes',                type: 'bonus', reward: 300 },
        ]
    },
    {
        name: "L5: The Needle's Eye",
        missionTitle: "Needle's Eye Precision Drop",
        description: "The hub is at the bottom of a shaft too narrow for your drone. Hover, extend your rope (E/Q), and lower cargo in!",
        gravity: 0.10,
        wind: 0,
        terrainType: "needle",
        targetCargo: 2,
        budget: 1800,
        timeLimit: 300,
        allowedTypes: ["normal"],
        collectionX: 180,
        deliveryHubs: [
            { x: 700, width: 25, color: "#38bdf8", type: "normal", name: "The Pit" }
        ],
        hint: "E/Q to extend/retract rope. SPACE drops cargo. Return to HQ to extract.",
        palette: {
            skyTop: '#040210', skyMid: '#080420', skyBot: '#0c0630',
            terrainFill: '#060418', rockEdge: '#a855f7', rockGlow: 'rgba(168,85,247,',
            fog: 'rgba(168,85,247,0.08)',
        },
        quests: [
            { id: 'primary',         text: 'Lower 2 cargo into The Pit',  type: 'primary' },
            { id: 'no_cargo_lost',   text: 'No cargo lost',               type: 'bonus', reward: 400 },
            { id: 'quick',           text: 'Finish with 2+ min remaining',type: 'bonus', reward: 200, timeGoal: 120 },
        ]
    }
];

const upgradeCatalog = [
    { id: 'thrusterEfficiency', name: 'Thruster Efficiency', desc: 'Reduces fuel consumption by 15% per level.', maxLevel: 3, basePrice: 500 },
    { id: 'boostMode', name: 'Engine Boost', desc: 'Increases main thruster power by 20% per level.', maxLevel: 3, basePrice: 800 },
    { id: 'magneticDeck', name: 'Magnetic Deck', desc: 'Automatically pulls nearby cargo into the basket.', maxLevel: 2, basePrice: 1200 },
    { id: 'winchExtender', name: 'Winch Extender', desc: 'Increases maximum drone rope length by 50m.', maxLevel: 2, basePrice: 600 },
    { id: 'hullPlating', name: 'Hull Plating', desc: 'Increases lander max integrity and impact resistance.', maxLevel: 3, basePrice: 400 },
    { id: 'shieldRegen', name: 'Shield Generator', desc: 'Slowly regenerates integrity and adds a protective energy bubble.', maxLevel: 2, basePrice: 1500 }
];

