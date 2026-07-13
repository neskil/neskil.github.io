// Level 4 — Gravity Anomaly
// Biome: Volcanic / Lava Rock / Orange-Red.
// The defining hazard is a moving gravity well that orbits its base position —
// physics.js reads gravityWell.orbitRadius and applies a Lissajous phase offset each tick.
// Two cargo types (normal → Sector 4, red → Deep Storage) force the player to read labels
// while also fighting the vortex pull. Two vent fields — one over the western approach,
// one over the eastern lava pit — periodically flare molten gas. Open sky above (no ceiling)
// so the vortex and vents are the only things keeping the player honest.

registerLevel({
    name: "L4: Gravity Anomaly",
    missionTitle: "Anomaly Zone — Dual Cargo Sort",
    description: "Sector 4 sits inside a classified Anomaly Zone where a gravitational vortex drifts in slow orbit, dragging anything nearby off course. Standard packages go to Sector 4 on the western dip, past a vent field that guards the HQ approach; red-tagged goods belong in Deep Storage on the eastern ridge, past a second vent field flaring molten gas over an exposed lava pit. Don't let the vortex pull you off course, and don't let either flare catch you.",
    weather: 'ash',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.28,           // Heavy gravity — volcanic world has dense core
    wind: 0,
    heavyCargo: false,       // Cargo mass no longer affects handling
    heatHaze: true,          // volcanic biome — GPU post-fx shimmer (see shaders.js renderPostFX)


    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground — valley floor shaped around the gravity well, with a lava-pit
        // notch under the vent field and an undulating ridge pad on the east side
        [
            // Left approach and HQ spawn area
            {x: -400, y: 650}, {x: 100, y: 650},
            // Main wide dip for the hub (Sector 4)
            {x: 200, y: 650}, {x: 300, y: 550}, {x: 600, y: 550}, {x: 700, y: 650},
            // Lava pit notch — exposed pool under the vent field's flare zone
            {x: 800, y: 640}, {x: 870, y: 700}, {x: 970, y: 700}, {x: 1040, y: 640},
            {x: 1150, y: 650},
            // Eastern ridge — gentle rise to a landing pad for Deep Storage (x:1300)
            {x: 1200, y: 600}, {x: 1400, y: 600}, {x: 1450, y: 650},
            {x: 1800, y: 650},
            // Enclosure
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.85,         // Normal pad scale
    targetCargo: 4,
    deposit: 1000,
    fee: 200,
    timeLimit: 210,
    allowedTypes: ["normal", "red"],
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
        { x: 410,  color: "#22c55e", type: "normal", name: "Sector 4" },
        { x: 1300, color: "#ef4444", type: "red",    name: "Deep Storage" },
    ],

    // ── Water Bodies ──────────────────────────────────────────────────────────
    // Exposed lava pool sitting in the terrain notch beneath the vent field —
    // decorative, not an OOB zone; the incinerator hazard flares just above it.
    waterBodies: [
        {
            hasBoat: false,
            color: 'rgba(249, 115, 22, 0.6)',
            surfaceColor: '#f97316',
            pts: [
                {x: 870, y: 700},
                {x: 970, y: 700},
                {x: 970, y: 660},
                {x: 870, y: 660}
            ]
        }
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

    // ── Hazards ───────────────────────────────────────────────────────────────
    // Gravity well drifts in slow orbit over the western dip, dragging the
    // lander off course near Sector 4. Two lava vent fields pulse on a
    // charge/flare duty cycle — one over the exposed pit notch en route to
    // Deep Storage, one guarding the approach out of HQ — and cargo caught
    // inside while active is destroyed outright (see physics/atmosphere.js's
    // 'incinerator' hazard branch).
    hazards: [
        { type: 'gravwell', pts: [{x: 500, y: 200}, {x: 700, y: 400}, {x: 500, y: 600}, {x: 300, y: 400}], startForce: 0.35, endForce: 0.35, radius: 200, speed: 200 },
        { type: 'incinerator', pts: [{ x: 950, y: 550 }, { x: 1150, y: 550 }, { x: 1150, y: 650 }, { x: 950, y: 650 }], onMs: 1500, offMs: 2200, warnMs: 600, damagePerSec: 30 },
        { type: 'incinerator', pts: [{ x: 150, y: 300 }, { x: 350, y: 300 }, { x: 350, y: 480 }, { x: 150, y: 480 }], onMs: 1200, offMs: 1900, warnMs: 500, damagePerSec: 30 },
    ],

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Check the cargo type before flying — normal label = Sector 4 (west dip), red label = Deep Storage (east ridge). The vortex drifts, so don't hover near the centre. Watch both vent fields flare — one guards the HQ approach, one guards the eastern lava pit. Return to HQ once all crates are sorted.",

    quests: [
        questPrimary('Sort & deliver 4 cargo'),
        questNoCargoLost('No cargo sucked into the vortex or dropped in the lava', 400),
        questQuick('Finish with 20+ sec remaining', 20, 250),
    ],
});
