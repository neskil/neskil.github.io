// Level 2 — Cross-Dock Sorting
// Biome: Amber Wastes. Two hubs separated by a yawning chasm in the plateau.
// First sorting challenge: normal vs. fragile (red) cargo must go to different hubs.
// The chasm in the terrain is impassable — it forces the player to read hub type before landing.
// A ledge partway down the west wall holds a risky cash pickup for players willing to dip in.

registerLevel({
    name: "L2: Cross-Dock Sorting",
    missionTitle: "Amber Wastes — Cross-Dock Run",
    description: "The Amber Wastes distribution node splits all inbound freight by hazard class. Standard packages go to Main Processing on the western shelf; red-tagged fragile goods belong in Fragile Handling on the eastern plateau. A deep chasm cuts the two sides apart — read the label before you commit to a landing.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.15,
    wind: 0,
    heatHaze: true, // desert biome — GPU post-fx shimmer (see shaders.js renderPostFX)

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        [
            // Western plateau — rolling dune variation; HQ (startX:-100) and
            // collection depot (collectionX:0) sit on the gentle mid-shelf,
            // Main Processing hub (x:500) has its own flat pad
            {x: -400, y: 650}, {x: -320, y: 600}, {x: -220, y: 650}, {x: -140, y: 610},
            {x: -40, y: 640}, {x: 60, y: 600}, {x: 160, y: 650}, {x: 260, y: 600},
            {x: 360, y: 630}, {x: 420, y: 600}, {x: 520, y: 610}, {x: 580, y: 590},
            // West rim spire — rock spur marking the chasm lip
            {x: 600, y: 560}, {x: 630, y: 600},
            // Chasm west wall — steep drop to a ledge shelf (cash pickup lives here)
            {x: 650, y: 820}, {x: 715, y: 830},
            // Plunge to the abyss floor — the monster waits below
            {x: 730, y: 1500}, {x: 790, y: 1500},
            // Chasm east wall — climbs straight back to the eastern plateau
            {x: 800, y: 600},
            // Eastern plateau — rolling dune variation; Fragile Handling hub
            // (x:800) has its own flat pad just past the rim
            {x: 920, y: 640}, {x: 1000, y: 615}, {x: 1100, y: 650}, {x: 1200, y: 600},
            {x: 1350, y: 620}, {x: 1500, y: 565}, {x: 1650, y: 590}, {x: 1800, y: 550},
            // Bottom enclosure
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // Ceiling — jagged overhanging rock formation framing both hubs and
        // the chasm mouth, instead of a flat slab; ample clearance above the
        // pads (min gap ~400px)
        [
            {x: -400, y: -200}, {x: 1800, y: -200},
            {x: 1800, y: 120}, {x: 1650, y: 180}, {x: 1500, y: 130},
            {x: 1300, y: 170}, {x: 1150, y: 110},
            {x: 950, y: 190}, {x: 800, y: 130},
            {x: 650, y: 170}, {x: 500, y: 110},
            {x: 350, y: 160}, {x: 200, y: 100},
            {x: -400, y: 150}
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 1.2,
    startX: -100,
    collectionX: 0,
    targetCargo: 2,
    budget: 600,
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

    // ── Collectibles ──────────────────────────────────────────────────────────
    // Risky cash pickup on the chasm ledge — reachable without going all the
    // way to the abyss floor, but still a detour off the direct hub-to-hub line
    collectibles: [
        { type: 'cash', x: 685, y: 790, value: 300 },
    ],

    // ── Palette (Desert / Amber) ──────────────────────────────────────────────
    palette: {
        skyTop:      '#1c0f03',
        skyMid:      '#3a1f08',
        skyBot:      '#5a2f0c',
        terrainFill: '#0a0501',
        rockEdge:    '#f59e0b',
        rockGlow:    'rgba(245,158,11,',
        fog:         'rgba(217,119,6,0.08)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Check the cargo type before flying — blue label = Main Processing (west), red label = Fragile Handling (east). Wrong hub = no payment. A cash pickup sits on a ledge partway down the chasm if you're willing to detour. Return to HQ once both are delivered.",

    quests: [
        questPrimary('Sort & deliver 2 cargo'),
        questNoCargoLost('No mislabeled deliveries', 300),
        questQuick('Finish with 45+ sec remaining', 45, 200),
    ],
});
