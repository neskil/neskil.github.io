// Level 4 — Gravity Anomaly
// Biome: Volcanic / Lava Rock / Orange-Red.
// Redesigned (2026-07-13) around a one-way loop instead of an open dual-hub
// sort: HQ sits on a surface plateau far west, the cargo depot sits atop a
// tall ridge pillar far east — the direct route between them drifts through
// the level's one gravity well (a wormhole-style vortex, orbiting mid-air).
// Cargo gets carried back and dropped inside a cave alcove in the middle of
// the map; a lava vent field guards the cave's mouth (the "heat" gate) so
// the player has to time the flare before ducking in to deliver. Getting
// back to HQ from the cave doesn't require re-running the vent/vortex
// gauntlet — a low tunnel under the valley connects the cave straight back
// to the base of the HQ cliff.
registerLevel({
    name: "L4: Gravity Anomaly",
    missionTitle: "Anomaly Zone — Vortex Run",
    description: "HQ sits on a western plateau; the cargo dock is atop a ridge pillar far to the east, past a gravitational vortex drifting in slow orbit over the open valley. Bring each crate back to the Hollow — a cave alcove carved into the ridge below the dock — but a lava vent guards its mouth, flaring on a duty cycle. Time the flare, duck inside to deliver, then take the low tunnel under the valley floor straight back to HQ instead of running the vortex a second time.",
    weather: 'ash',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.28,           // Heavy gravity — volcanic world has dense core
    wind: 0.015,             // Faint volcanic updraft — texture, the vortex is the real hazard here
    heavyCargo: false,       // Cargo mass no longer affects handling
    heatHaze: true,          // volcanic biome — GPU post-fx shimmer (see shaders.js renderPostFX)

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainPolygons: [
        // Ground — HQ plateau (west) down into the valley, a shaft dropping
        // into the shortcut tunnel, back up into the Hollow cave floor, the
        // vent-guarded neck, then up the eastern ridge to the dock plateau.
        [
            // HQ plateau
            {x: -400, y: 230}, {x: 100, y: 230},
            // Cliff down to the valley floor
            {x: 180, y: 600}, {x: 260, y: 600},
            // West tunnel shaft — drops into the shortcut corridor
            {x: 260, y: 900},
            // Tunnel floor running east under the valley
            {x: 560, y: 900},
            // East tunnel shaft — climbs back up into the Hollow's floor
            {x: 560, y: 650}, {x: 650, y: 650},
            // The Hollow — cave floor (delivery hub sits at x:800)
            {x: 950, y: 650},
            // Vent-guarded neck rising out of the cave mouth
            {x: 1000, y: 550}, {x: 1050, y: 450},
            // Climb the eastern ridge to the dock plateau (cargo depot at x:1300)
            {x: 1100, y: 230}, {x: 1600, y: 230},
            // Descend the far east cliff
            {x: 1650, y: 400}, {x: 1800, y: 650},
            // Enclosure
            {x: 1800, y: 1800}, {x: -400, y: 1800}
        ],
        // The Hollow's cave roof — a floating rock mass overhanging the
        // delivery floor (x:650-950) so it reads as an enclosed cave, dipping
        // low toward the vent neck at its eastern edge.
        [
            {x: 600, y: 100}, {x: 1080, y: 100},
            {x: 1080, y: 480}, {x: 950, y: 400}, {x: 750, y: 350}, {x: 650, y: 420},
            {x: 600, y: 100}
        ],
        // Shortcut tunnel lid — seals the trench between the two shaft mouths
        // (x:260 and x:560) into a low tunnel; the shafts themselves stay open
        // to the sky so the entrances read clearly.
        [
            {x: 260, y: 500}, {x: 560, y: 500}, {x: 560, y: 650}, {x: 260, y: 650},
            {x: 260, y: 500}
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    padScale: 0.85,
    targetCargo: 4,
    deposit: 1000,
    fee: 200,
    timeLimit: 220,
    allowedTypes: ["normal"],
    startX: -100,           // HQ on the western plateau
    collectionX: 1300,      // Cargo dock atop the eastern ridge pillar

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'goo',
        color: 'rgba(239, 68, 68, 0.7)',
        mistColor: 'rgba(239, 68, 68, 0.4)',
        surfaceY: 1200,     // Molten plasma pool below terrain
        drag: 0.96,         // Thick plasma — slows descent but the monster still comes
        buoyancy: -0.1,
    },
    worldBounds: {
        bottomY: 1600,
        bottomAction: 'monster'
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 800, color: "#22c55e", type: "normal", name: "The Hollow" },
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
    // One gravity well (the level's defining vortex) orbits over the open
    // valley between HQ and the Hollow — directly in the path of the direct
    // route to the dock. One lava vent guards the Hollow's cave mouth on a
    // charge/flare duty cycle; cargo caught inside while it's active is
    // destroyed outright (see physics/atmosphere.js's 'incinerator' branch).
    hazards: [
        { type: 'gravwell', pts: [{x: 400, y: 150}, {x: 550, y: 300}, {x: 400, y: 450}, {x: 250, y: 300}], startForce: 0.35, endForce: 0.35, radius: 180, speed: 160 },
        { type: 'incinerator', pts: [{ x: 900, y: 400 }, { x: 1100, y: 400 }, { x: 1100, y: 650 }, { x: 900, y: 650 }], onMs: 1500, offMs: 2200, warnMs: 600, damagePerSec: 30, behindTerrain: true },
    ],

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Grab cargo from the dock atop the eastern ridge, then ride the valley back west — the vortex drifts, so don't hover near its centre. Watch the vent flare before ducking into the Hollow to deliver. Skip the vortex on the way home: dive down the shaft next to the Hollow into the tunnel and ride it straight back to HQ.",

    quests: [
        questPrimary('Deliver 4 cargo to The Hollow'),
        questNoCargoLost('No cargo sucked into the vortex or caught in the vent', 400),
        questQuick('Finish with 20+ sec remaining', 20, 250),
    ],
});
