// Level 6 — The Sand Worm's Lair
// Biome: Desert Dunes / Amber Dusk.
// Layout:
//   [1] HQ — upper-left plateau (startX: 80)
//   [2] Cargo pickup — lower-left valley shelf (collectionX: 200), near the lake
//   [3] Drop-off — upper-right plateau (Eastern Base hub at x:1460)
//   Lake — central depression; OOB water zone fills the valley floor
//   Worm Pit — raised central mound; a `sandworm`-type hazard polygon
//   (see hazards[] below) marks the AI spawn zone
// The worm only spawns after all cargo is delivered if the player lingers — or if OOB timeout fires.
// radarPingZone draws an animated sonar ring over the danger area in game.js.

registerLevel({
    name: "L6: The Sand Worm's Lair",
    missionTitle: "Amber Dusk — Sand Worm Extraction",
    description: "A colossal sand worm has colonised the central dune mound, making the valley floor extremely dangerous. Descend to the left-side shelf to collect cargo, then fly low and fast across the worm's territory to the Eastern Base on the far plateau. The creature hunts by vibration — slow hovering near the mound is an invitation.",
    weather: 'heatwave',

    // ── Identity flag ─────────────────────────────────────────────────────────
    terrainType: 'worm-lair',

    // Radar ping zone — read by drawRadarPingZone() in game.js.
    // color is an RGB string; r is max ping radius; period is ms per cycle.
    radarPingZone: { cx: 900, cy: 580, r: 280, color: '200, 100, 20', period: 3600 },

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
        ]
    ],

    // ── Mission parameters ────────────────────────────────────────────────────
    targetCargo: 2,
    deposit: 1000,
    fee: 300,
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

    // ── Hazards ───────────────────────────────────────────────────────────────
    // Worm danger zone — a 12-point circle (cx:900, cy:580, r:280) around the
    // central mound, matching the radarPingZone above. spawnRate is the risk
    // multiplier used by the sand-worm spawn check (see terrainType:'worm-lair'
    // handling in physics/atmosphere.js) while the lander is inside the zone.
    hazards: [
        {
            type: 'sandworm',
            spawnRate: 1.0,
            comment: 'Worm danger zone (central mound)',
            pts: [
                {x: 1180, y: 580}, {x: 1143, y: 720}, {x: 1040, y: 823}, {x: 900,  y: 860},
                {x: 760,  y: 823}, {x: 658,  y: 720}, {x: 620,  y: 580}, {x: 658,  y: 440},
                {x: 760,  y: 338}, {x: 900,  y: 300}, {x: 1040, y: 338}, {x: 1143, y: 440}
            ]
        }
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
    hint: "Descend quickly to the left valley to collect cargo, then gain altitude before crossing the central mound — the worm targets anything near the dune peak. Once delivered, return to HQ fast.",

    quests: [
        questPrimary('Deliver 2 cargo to Eastern Base'),
        questSurviveWorm(550),
        questQuick('Finish with 1+ min remaining', 60, 300),
    ],
});
