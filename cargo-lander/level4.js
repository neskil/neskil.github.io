// Level 4 — Gravity Anomaly
// Biome: Volcanic / Lava Rock / Orange-Red.
// The defining hazard is a moving gravity well that orbits its base position —
// physics.js reads gravityWell.orbitRadius and applies a Lissajous phase offset each tick.
// Two cargo types (red → Sector 4, blue → Deep Storage) force the player to read labels
// while also fighting the vortex pull and the floating asteroid obstacles.
// Underground easter egg: a blinking server rack cluster lives 60px below the terrain surface.

registerLevel({
    name: "L4: Gravity Anomaly",
    missionTitle: "Anomaly Zone — Dual Cargo Sort",
    description: "Sector 4 sits inside a classified Anomaly Zone where a gravitational vortex drifts in slow orbit, dragging anything nearby off course. A vent field near the eastern ridge periodically flares molten gas — cargo caught in a flare doesn't survive. Don't let the vortex pull you into the lava.",
    weather: 'ash',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.28,           // Heavy gravity — volcanic world has dense core
    wind: 0,
    heavyCargo: false,       // Cargo mass no longer affects handling
    heatHaze: true,          // volcanic biome — GPU post-fx shimmer (see shaders.js renderPostFX)

    // Moving gravity well — physics.js reads gravityWell config and applies
    // a Lissajous-phase orbit so the pull point drifts unpredictably
    gravityWell: {
        x: 500,
        y: 400,
        strength: 0.35,
        radius: 200,
        orbitRadius: 200,   // well orbits its base position (Lissajous phase)
    },

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ceiling
        [
            {x: -400, y: -200}, {x: 1800, y: -200},
            {x: 1800, y: 0}, {x: -400, y: 0}
        ],
        // Ground — valley floor shaped around the gravity well;
        [
            // Left approach and HQ spawn area
            {x: -400, y: 650}, {x: 100, y: 650},
            // Main wide dip for the hub (Sector 4)
            {x: 200, y: 650}, {x: 300, y: 550}, {x: 600, y: 550}, {x: 700, y: 650},
            // Eastern ridge — higher ground
            {x: 1000, y: 650}, {x: 1800, y: 650},
            // Enclosure
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.85,         // Normal pad scale
    targetCargo: 3,
    budget: 2000,
    timeLimit: 180,
    allowedTypes: ["normal"],
    collectionX: -100,      // Pickup depot is behind HQ on the far-left — safe from the vortex

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'goo',
        color: 'rgba(239, 68, 68, 0.7)',
        mistColor: 'rgba(239, 68, 68, 0.4)',
        surfaceY: 1200,     // Molten plasma pool below terrain
        drag: 0.96,         // Thick plasma — slows descent but the monster still comes
        buoyancy: -0.1,
        monsterDepth: 1600
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 410, color: "#22c55e", type: "normal", name: "Sector 4" },
    ],

    // ── Palette (Volcanic / Orange-Red) ──────────────────────────────────────
    palette: {
        skyTop:      '#0e0403',
        skyMid:      '#1a0602',
        skyBot:      '#2a0a04',
        terrainFill: '#050100',
        rockEdge:    '#f97316',
        rockGlow:    'rgba(249,115,22,',
        fog:         'rgba(249,115,22,0.08)',
    },

    // ── Segments ──────────────────────────────────────────────────────────────
    segments: [],

    // ── Hazards ───────────────────────────────────────────────────────────────
    // Lava vent field on the eastern ridge — pulses on a charge/flare duty cycle;
    // cargo caught inside while it's active is destroyed outright (see
    // physics/atmosphere.js's 'incinerator' hazard branch).
    hazards: [
        { type: 'incinerator', pts: [{ x: 950, y: 550 }, { x: 1150, y: 550 }, { x: 1150, y: 650 }, { x: 950, y: 650 }], onMs: 1500, offMs: 2200, warnMs: 600, damagePerSec: 30 },
    ],

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "The vortex drifts — don't hover near the centre. Watch the eastern vent field flare before crossing it. Return to HQ to extract.",

    quests: [
        questPrimary('Deliver cargo to Sector 4'),
        questNoCargoLost('No cargo sucked into the vortex', 400),
        questQuick('Finish with 20+ sec remaining', 20, 250),
    ],
});

