// Level 4 — Gravity Anomaly
// Biome: Volcanic / Orange. Moving gravity well + tight pads + two cargo types.

registerLevel({
    name: "L4: Gravity Anomaly",
    missionTitle: "Anomaly Zone Delivery",
    description: "A gravitational vortex is pulling you in. Counter the force and sort red/blue cargo to their correct hubs.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.28,           // Heavy gravity
    wind: 0,
    heavyCargo: true, // Cargo weight affects lander handling

    // Moving gravity well — physics.js reads gravityWell config
    gravityWell: {
        x: 500,
        y: 400,
        strength: 0.8,
        radius: 200,
        orbitRadius: 200,   // well orbits its base position (Lissajous phase)
    },

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground - valley around the well
        [
            {x: -400, y: 650}, {x: 100, y: 650}, {x: 300, y: 550}, 
            {x: 450, y: 650}, {x: 600, y: 650}, // Red Hub at x=500
            {x: 750, y: 550}, {x: 900, y: 650}, {x: 1050, y: 650}, // Blue Hub at x=950
            {x: 1200, y: 550}, {x: 1800, y: 550}, {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // Floating Asteroid 1 (Left of well)
        [
            {x: 200, y: 250}, {x: 350, y: 200}, {x: 300, y: 350}, {x: 220, y: 320}
        ],
        // Floating Asteroid 2 (Right of well)
        [
            {x: 700, y: 300}, {x: 850, y: 250}, {x: 800, y: 400}, {x: 680, y: 350}
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.70,         // tightest standard pads so far
    targetCargo: 2,
    budget: 2000,
    timeLimit: 180,
    allowedTypes: ["red", "blue"],
    collectionX: -100,

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'goo',
        color: 'rgba(239, 68, 68, 0.7)',
        mistColor: 'rgba(239, 68, 68, 0.4)',
        surfaceY: 1200,
        drag: 0.96,       // Thick plasma
        buoyancy: -0.1,
        monsterDepth: 1600
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 525, color: "#ef4444", type: "red",    name: "Sector 4"     },
        { x: 975, color: "#3b82f6", type: "blue",   name: "Deep Storage" },
    ],

    // ── Palette (Volcanic / Orange-Red) ──────────────────────────────────────
    palette: {
        skyTop:      '#0e0403',
        skyMid:      '#1a0602',
        skyBot:      '#2a0a04',
        terrainFill: '#120402',
        rockEdge:    '#f97316',
        rockGlow:    'rgba(249,115,22,',
        fog:         'rgba(249,115,22,0.08)',
    },

    // ── Segments — floating lava platforms and a diagonal barrier ────────────
    // Coordinates are in level-space (same as deliveryHub x values).
    // The lander and cargo boxes collide with these just like terrain.
    segments: [
        // Floating lava platform — left of the vortex zone
        { x1: 300, y1: 520, x2: 420, y2: 520 },
        // Short angled ramp leading up to it
        { x1: 220, y1: 570, x2: 300, y2: 520 },
        // Floating platform — right side, near the hubs
        { x1: 620, y1: 480, x2: 720, y2: 480 },
        // Diagonal barrier cutting across the upper cave
        { x1: 480, y1: 300, x2: 560, y2: 380 },
    ],

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Avoid the vortex and the lava platforms! Return to HQ to extract.",

    quests: [
        questPrimary('Deliver red & blue cargo'),
        questNoCargoLost('No cargo sucked in', 350),
        questNoCrash(300),
    ],
});
