// Level 6 — The Sand Worm's Lair
// Biome: Desert dunes / Amber dusk. Colossal sand worm hazard — speed is survival.

registerLevel({
    name: "L6: The Sand Worm's Lair",
    missionTitle: "Sand Worm Extraction",
    description: "A colossal sand worm lurks beneath the dunes. Deliver the cargo quickly before it strikes!",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.12,          // slightly lighter — worm threat compensates difficulty
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground - pillars and deep worm pits
        [
            {x: -400, y: 650}, {x: 300, y: 650}, // Start area
            {x: 350, y: 450}, {x: 450, y: 450}, // Pillar 1
            {x: 500, y: 1500}, {x: 750, y: 1500}, // Worm Pit 1
            {x: 800, y: 350}, {x: 900, y: 350}, // Pillar 2 (higher)
            {x: 950, y: 1500}, {x: 1150, y: 1500}, // Worm Pit 2
            {x: 1200, y: 650}, {x: 1800, y: 650}, // End Base
            {x: 1800, y: 1800}, {x: -400, y: 1800} // Enclosure
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 1,
    budget: 2000,
    timeLimit: 180,
    allowedTypes: ["normal", "red", "tethered"],
    collectionX: 60,        // collection depot on the far-left edge

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'sand',
        color: '#78350f',
        mistColor: 'rgba(120, 53, 15, 0.4)',
        surfaceY: 1300,
        drag: 0.8,        // Deep sand dunes
        buoyancy: -0.15,
        monsterDepth: 1450
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1100, width: 100, color: "#f59e0b", type: "chute", name: "Dune Chute" },
        { x: 1370, width: 90, color: "#10b981", type: "normal", name: "Dune Base" }
    ],

    // ── Palette (Desert / Amber Dusk) ─────────────────────────────────────────
    palette: {
        skyTop:      '#1a1005',
        skyMid:      '#3a2010',
        skyBot:      '#5a3015',
        terrainFill: '#1a1005',
        rockEdge:    '#d97706',
        rockGlow:    'rgba(217,119,6,',
        fog:         'rgba(217,119,6,0.15)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "The sand worm is more likely to attack if you linger near its pit. Move fast!",

    quests: [
        questPrimary('Deliver cargo to Dune Base'),
        questSurviveWorm(500),
    ],
});
