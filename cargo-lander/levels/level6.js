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
// The sandworm hazard's centroid drives an animated sonar ring (drawRadarPingZone() in render/ui.js).
//
// ── 2026-08-02 difficulty pass: the level had no vertical pressure ──────────
// The old build could be beaten by climbing to ~y:150 and cruising straight
// over the mound: the worm's spawn zone topped out around y:300 and nothing
// else lived up there, so altitude was a free bypass of the level's one hazard.
// Three changes turn height into a trade instead of an answer:
//   1. A dust-storm band (fogBandTopY/BottomY) caps the sky. Visibility falls
//      off from y:330 upward and is a whiteout by y:40, and the grit costs hull
//      the whole time you're in it — so "just fly higher" is blind AND expensive.
//   2. Heavy freight traffic is pinned to y:60-300 — i.e. INSIDE that band. The
//      high road is now a blind lane full of trucks you meet at ~200px notice
//      (render/fog.js leaves each one a faint running-light glow in the murk).
//   3. The worm actually hunts: it tracks the lander for ~14 frames instead of
//      ~1, its strike carries ~570px above the sand instead of ~320, and
//      proximityScale:2 makes hugging the peak near-certain death.
// Net: cross low and clear-eyed through the worm's reach, or cross high and
// blind through the freight lane. Threading the seam between them (y:250-330)
// gets you a bit of both.

registerLevel({
    name: "L6: The Sand Worm's Lair",
    missionTitle: "Amber Dusk — Sand Worm Extraction",
    description: "A colossal sand worm has colonised the central dune mound, and a standing dust storm has pushed the freight lanes down on top of it. Collect cargo from the left-side shelf, then pick your poison: run the valley floor where you can see but the worm can reach you, or climb into the storm where nothing can reach you except the traffic you won't see coming.",
    weather: 'heatwave',

    // ── Identity flag ─────────────────────────────────────────────────────────
    terrainType: 'worm-lair',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.14,
    wind: 0.03,       // Storm-driven; the gust cycle below does the real work
    heatHaze: true,
    // Gusts sell the storm and add a telegraphed, dodgeable pressure on the
    // crossing — the wind meter flashes amber through `warn` before each surge.
    windGust: { calm: 5, warn: 2, gust: 5, gustMult: 3.2 },

    // ── Dust storm ceiling ────────────────────────────────────────────────────
    // Visibility ramps from clear at y:330 to a near-total whiteout at y:40 and
    // above (render/fog.js). fogBandDamage is grit abrasion at full density —
    // ~1.4 hull/sec at the freight lane's midpoint, ~2.9 up at the ceiling — so
    // loitering at altitude bleeds you even if you never touch anything.
    fogBandBottomY: 330,
    fogBandTopY: 40,
    fogBandColor: '210,150,80',
    fogBandOpacity: 0.94,
    fogBandDamage: 3,

    // ── Freight traffic ───────────────────────────────────────────────────────
    // Rate 4 => up to 20 concurrent vehicles, spawning every ~105 frames, and
    // the pre-warm seeds 4-8 already in the air at mission start. The Y band is
    // deliberately the same slab of sky as the dust storm: that overlap IS the
    // level's second hazard.
    ambientTrafficRate: 4,
    ambientTrafficSpeed: 1.5,
    ambientTrafficMinY: 60,     // top of the lane (smaller Y = higher)
    ambientTrafficMaxY: 300,    // bottom of the lane, just above the clear air

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
    timeLimit: 260,   // +20s over the old build — both routes are slower now
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
    },
    worldBounds: {
        bottomY: 1050,
        bottomAction: 'monster',
        leftMargin: 3000,
        rightMargin: 3000
    },

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 1460, width: 110, color: "#3b82f6", type: "normal", name: "Eastern Base" }
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    // Worm danger zone — a triangle around the central mound (cx:900, cy:580).
    // drawRadarPingZone() (render/ui.js) sonar-pings the triangle's centroid and
    // sizes the warning ring off `reach`, so the visible zone always matches the
    // spawn check. spawnRate is the base risk multiplier while the lander is
    // inside the zone; proximityScale scales it up toward the centre (see the
    // terrainType:'worm-lair' handling in physics/atmosphere.js).
    //
    // reach:330 lifts the zone's ceiling to y:250 above the peak, so it now
    // overlaps the bottom of the freight lane — there is no altitude that is
    // clear of both. The strike-shape fields (trackFrames/decay/etc, defaulted
    // in _sandWormTuning()) are what make it a hunt rather than a formality:
    // 14 frames of homing punishes hovering but stays dodgeable if you're
    // moving, and decay:0.94 carries the arc ~570px up instead of ~320.
    hazards: [
        {
            type: 'sandworm',
            spawnRate: 1.0,
            proximityScale: 2.0,   // 3x risk directly over the peak vs the zone edge
            reach: 330,
            color: '200, 100, 20',
            period: 5400,
            trackFrames: 14,
            steer: 3.2,
            lungeSpeed: 34,
            maxSpeed: 46,
            decay: 0.94,
            retractSpeed: 16,
            hitRadius: 85,
            damage: 6,
            wormLength: 42,
            comment: 'Worm danger zone (central mound)',
            pts: [
                {x: 900, y: 300}, {x: 658, y: 720}, {x: 1143, y: 720}
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
    hint: "Two ways across, both bad. LOW: skim the valley floor and the mound's flanks — you can see everything, but the worm's sonar ring is the zone it can strike into, and hovering anywhere near the peak summons it. HIGH: climb into the dust storm above y:330 — the worm can't reach you, but visibility drops to nothing, the grit grinds your hull, and the freight lanes run straight through it. Watch for running lights in the murk; that's your only warning. The seam just under the storm is the narrowest safe line.",

    quests: [
        questPrimary('Deliver 2 cargo to Eastern Base'),
        questSurviveWorm(550),
        questQuick('Finish with 1+ min remaining', 60, 300),
    ],
});
