// Level 2 — Cross-Dock Sorting
// Biome: Amber Wastes. Two hubs separated by a yawning chasm in the plateau.
// First sorting challenge: normal vs. fragile (red) cargo must go to different hubs.
// The chasm in the terrain is impassable — it forces the player to read hub type before landing.

registerLevel({
    name: "L2: Cross-Dock Sorting",
    missionTitle: "Amber Wastes — Cross-Dock Run",
    description: "The Amber Wastes distribution node splits all inbound freight by hazard class. Standard packages go to Main Processing on the western shelf; red-tagged fragile goods belong in Fragile Handling on the eastern plateau. A deep chasm cuts the two sides apart — read the label before you commit to a landing.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [[
        // Western plateau — HQ and Main Processing hub land here
        {x: -400, y: 650}, {x: 100, y: 650}, {x: 300, y: 600}, {x: 600, y: 600},
        // Chasm — a sheer drop to the abyss; the monster waits at the bottom
        {x: 630, y: 1500}, {x: 750, y: 1500},
        // Eastern plateau — Fragile Handling hub; slightly higher than the western shelf
        {x: 780, y: 600}, {x: 1200, y: 600}, {x: 1800, y: 550},
        // Bottom enclosure
        {x: 1800, y: 1800}, {x: -400, y: 1800}
    ]],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 1.2,
    startX: -100,
    collectionX: 0,
    targetCargo: 2,
    budget: 1200,
    timeLimit: 240,
    allowedTypes: ["normal", "red"],

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'sand',
        color: 'rgba(217, 119, 6, 0.7)',
        mistColor: 'rgba(180, 83, 9, 0.4)',
        surfaceY: 1700,
        drag: 0.85,       // Quicksand: heavy drag
        buoyancy: -0.2,   // Quicksand: strong push up, but hard to move
        monsterDepth: 1900
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 500, color: "#38bdf8", type: "normal", name: "Main Processing" },
        { x: 800, color: "#ef4444", type: "red",    name: "Fragile Handling" },
    ],

    // ── Palette (Desert / Amber) ──────────────────────────────────────────────
    palette: {
        skyTop:      '#120a02',
        skyMid:      '#1e1005',
        skyBot:      '#2e1a06',
        terrainFill: '#080401',
        rockEdge:    '#d97706',
        rockGlow:    'rgba(217,119,6,',
        fog:         'rgba(217,119,6,0.06)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Check the cargo type before flying — blue label = Main Processing (west), red label = Fragile Handling (east). Wrong hub = no payment. Return to HQ once both are delivered.",

    quests: [
        questPrimary('Sort & deliver 2 cargo'),
        questNoCargoLost('No cargo lost', 250),
        questNoCrash(300),
    ],
});
