// Level 6 — The Sand Worm's Lair
// Biome: Desert Dunes / Amber Dusk.
// Layout:
//   [1] HQ — upper-left plateau (startX: 80)
//   [2] Cargo pickup — lower-left valley shelf (collectionX: 200), near the lake
//   [3] Drop-off — upper-right plateau (Eastern Base hub at x:1460)
//   Lake — central depression; OOB water zone fills the valley floor
//   Worm Pit — raised central mound; wormPitCX/CY define the AI spawn epicentre
//   Rock Arch — a stone bridge straddling the mound (2026-07-10 design pass) turns the
//   crossing into a real route choice: duck through the low tunnel under the arch (fast,
//   right over the worm's peak) or climb up and over the outer arch silhouette (slow, safe,
//   costs altitude and time). A risky fuel pickup sits just past the tunnel exit, rewarding
//   whoever takes the low line. Half-buried wreckage litters the mound's western flank.
// The worm only spawns after all cargo is delivered if the player lingers — or if OOB timeout fires.
// radarPingZone draws an animated sonar ring over the danger area in game.js.

registerLevel({
    name: "L6: The Sand Worm's Lair",
    missionTitle: "Amber Dusk — Sand Worm Extraction",
    description: "A colossal sand worm has colonised the central dune mound, making the valley floor extremely dangerous. A weathered stone arch still straddles the mound from some older age — descend to the left-side shelf to collect cargo, then either thread the low tunnel under the arch (fast, right over the worm's territory) or climb up and over it (slower, but out of the creature's reach) on your way to the Eastern Base on the far plateau. The creature hunts by vibration — slow hovering near the mound is an invitation.",
    weather: 'heatwave',

    // ── Identity flag ─────────────────────────────────────────────────────────
    terrainType: 'worm-lair',

    // Radar ping zone — read by drawRadarPingZone() in game.js.
    // color is an RGB string; r is max ping radius; period is ms per cycle.
    radarPingZone: { cx: 900, cy: 580, r: 280, color: '200, 100, 20', period: 3600 },

    // Physics spawn point for the sand worm (can reference the zone above)
    wormPitCX: 900,
    wormPitCY: 580,
    wormZoneR: 280,

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.18,
    wind: 0,
    heatHaze: true,

    // ── Terrain ───────────────────────────────────────────────────────────────
    // One large organic polygon:
    //  • Upper-left plateau (start HQ)
    //  • Drops into left valley (cargo pickup, near the lake)
    //  • Central raised mound (worm danger zone)
    //  • Another dip on the other side
    //  • Upper-right plateau (drop-off)
    terrainPolygons: [
        [
            // Upper-left plateau — HQ spawns at x:80; wide enough to turn around safely
            {x: -200, y: 430}, {x:  60,  y: 430},
            // Drop down to the left valley shelf — cargo collection depot is at x:200
            {x: 160,  y: 430}, {x: 180,  y: 590},
            {x: 350,  y: 640}, {x: 420,  y: 660},
            // Valley floor — OOB lake fills this depression; the terrain dips below surfaceY:780
            {x: 500,  y: 700}, {x: 560,  y: 780},
            {x: 700,  y: 800},
            // Central worm mound — rises above the valley; worm spawns from under this peak
            {x: 760,  y: 720}, {x: 820,  y: 580},
            {x: 900,  y: 520}, {x: 980,  y: 580},
            {x: 1040, y: 720}, {x: 1100, y: 800},
            // Right valley descent — mirrors the left; no safe landing here
            {x: 1160, y: 760}, {x: 1260, y: 680},
            {x: 1340, y: 620}, {x: 1380, y: 550},
            // Upper-right plateau — Eastern Base hub lands here at x:1460
            {x: 1420, y: 430}, {x: 1700, y: 430},
            // Enclosure
            {x: 1700, y: 1600}, {x: -200, y: 1600}
        ],
        // Rock Arch — straddles the mound; a tight low tunnel (ceiling ~160px above
        // the mound peak) rewards a fast, risky crossing, while its outer silhouette
        // (peak y:260) forces a real climb to go over the top instead
        [
            {x: 670, y: 820}, {x: 700, y: 560}, {x: 780, y: 340}, {x: 900, y: 260}, {x: 1020, y: 340}, {x: 1160, y: 560}, {x: 1190, y: 820},
            {x: 1140, y: 820}, {x: 1110, y: 600}, {x: 1020, y: 420}, {x: 900, y: 360}, {x: 780, y: 420}, {x: 700, y: 600}, {x: 720, y: 820}
        ]
    ],

    // ── Segments ──────────────────────────────────────────────────────────────
    // Half-buried wreckage on the mound's western flank — decorative
    segments: [
        { x1: 800, y1: 700, x2: 840, y2: 720 },
        { x1: 830, y1: 730, x2: 860, y2: 710 },
        { x1: 950, y1: 700, x2: 990, y2: 725 },
    ],

    // ── Collectibles ──────────────────────────────────────────────────────────
    // Fuel reward just past the tunnel exit — naturally on the low route's line,
    // a costly detour for anyone who took the high arch route instead
    collectibles: [
        { type: 'fuel', x: 1050, y: 480, amount: 30 },
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 2,
    budget: 2500,
    timeLimit: 240,
    allowedTypes: ["normal"],

    // Start HQ on the upper-left plateau
    startX: 80,
    // Cargo pickup on the lower-left shelf (valley)
    collectionX: 200,

    // ── Environment ───────────────────────────────────────────────────────────
    outOfBounds: {
        type: 'water',
        color: 'rgba(29, 78, 216, 0.65)',
        mistColor: 'rgba(59, 130, 246, 0.25)',
        surfaceY: 780,     // matches the valley floor height
        drag: 0.92,
        buoyancy: -0.18,
        monsterDepth: 1050
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1460, width: 110, color: "#3b82f6", type: "normal", name: "Eastern Base" }
    ],

    // ── Palette (Desert / Amber Dusk) ─────────────────────────────────────────
    palette: {
        skyTop:      '#1a0e03',
        skyMid:      '#3b1e08',
        skyBot:      '#5c3012',
        terrainFill: '#0a0401',
        rockEdge:    '#d97706',
        rockGlow:    'rgba(217,119,6,',
        fog:         'rgba(180,90,6,0.12)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Descend quickly to the left valley to collect cargo. At the mound, pick your line: duck through the low tunnel under the rock arch for a fast crossing right over the worm's territory (a fuel pickup waits just past the exit), or climb up and over the arch's outer silhouette for a slower but safer crossing. Once delivered, return to HQ fast.",

    quests: [
        questPrimary('Deliver 2 cargo to Eastern Base'),
        questSurviveWorm(550),
        questQuick('Finish with 1+ min remaining', 60, 300),
    ],
});

