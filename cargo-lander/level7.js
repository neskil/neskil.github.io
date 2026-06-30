// Level 7 — The Deep Haul
// Biome: Underground / Bioluminescent. Massive horizontal scrolling and tight cave navigation.

registerLevel({
    name: "L7: The Deep Haul",
    missionTitle: "Long Distance Underground",
    description: "A sprawling cavern system. You'll need to navigate tight corridors and manage your fuel carefully.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.16,
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Main floor with dips and tight squeezes
        [
            {x: -400, y: 550}, {x: 600, y: 550}, // Start area
            {x: 700, y: 400}, {x: 900, y: 400}, // Rise
            {x: 1000, y: 700}, {x: 1300, y: 700}, // Deep drop
            {x: 1500, y: 350}, {x: 1700, y: 350}, // High peak
            {x: 1900, y: 600}, {x: 2300, y: 600}, // Valley
            {x: 2500, y: 450}, {x: 2800, y: 450}, // Squeeze approach
            {x: 3200, y: 650}, {x: 3800, y: 650}, // End Base
            {x: 3800, y: 1500}, {x: -400, y: 1500} // Enclosure
        ],
        // Ceiling (Massive overhang to form a cave)
        [
            {x: -400, y: -200}, {x: 3800, y: -200}, // Top flat bound
            {x: 3800, y: 250}, {x: 3200, y: 250}, // Above End Base
            {x: 2800, y: 150}, {x: 2500, y: 150}, // Squeeze ceiling
            {x: 2300, y: 200}, {x: 1900, y: 200}, // Valley ceiling
            {x: 1700, y: -50}, {x: 1500, y: -50}, // High peak ceiling
            {x: 1300, y: 350}, {x: 1000, y: 350}, // Deep drop ceiling
            {x: 900, y: 100}, {x: 700, y: 100}, // Rise ceiling
            {x: 600, y: 200}, {x: -400, y: 200} // Start ceiling
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 3,
    budget: 4500,
    timeLimit: 360,
    allowedTypes: ["normal", "blue", "green"],
    collectionX: 300,        // collection depot on the left side

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'goo',
        color: '#10b981',
        mistColor: 'rgba(16, 185, 129, 0.3)',
        surfaceY: 1000,
        drag: 0.95,        
        buoyancy: -0.1,
        monsterDepth: 1200
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1200, width: 80, color: "#3b82f6", type: "blue", name: "Deep Node" },
        { x: 2100, width: 80, color: "#10b981", type: "green", name: "Valley Base" },
        { x: 3400, width: 80, color: "#38bdf8", type: "normal", name: "Far East Depot" }
    ],

    // ── Palette (Bioluminescent Cave) ─────────────────────────────────────────
    palette: {
        skyTop:      '#020617',
        skyMid:      '#040b16',
        skyBot:      '#051114',
        terrainFill: '#06101c',
        rockEdge:    '#38bdf8',
        rockGlow:    'rgba(56,189,248,',
        fog:         'rgba(56,189,248,0.1)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Fuel is limited. Plan your route carefully and don't accelerate too hard.",

    quests: [
        questPrimary('Deliver 3 cargos across the cave'),
        questNoCrash(800),
        questQuick('Finish in under 4 minutes', 120, 1000),
    ],
});
