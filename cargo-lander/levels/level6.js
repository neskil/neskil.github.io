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
// The original build could be beaten by climbing to ~y:150 and cruising over
// the mound: the worm's zone topped out around y:300 and nothing else lived up
// there, so altitude was a free bypass of the level's one hazard.
//
// The layout that fixes it, revised 2026-08-02 after playtest feedback that the
// first pass stacked everything into one blurry column ("worm too aggressive and
// quick, fog starts too far down, traffic too far up, fog shouldn't activate in
// the pit"). The three hazards now own three separate slabs of air:
//
//   y < 150   DUST CEILING. Visibility collapses upward to a whiteout at -180
//             and the grit grinds hull the whole time. Purely an altitude cap —
//             it starts ~280px above the plateaus, so flying the valley or the
//             pit never puts dust on screen. You only meet it by climbing out
//             of the level.
//   y 170-380 FREIGHT CORRIDOR. Terrain clearance clamps trucks to ~290 over
//             the plateaus — about 140px above the roofs, i.e. exactly the line
//             you'd take for a fast crossing. In clear air, so this is a
//             dodging problem, not a blindness one.
//   y > 387   WORM ZONE. A 300px circle centred on (900, 687), so it covers the
//             mound peak and both valley floors but tops out below the lane.
//             Crossing in the corridor never summons it; dipping toward the
//             sand does. Once out, its arc can carry above the zone — that is
//             deliberate, it just cannot be triggered from up there.
//
// So the crossing is a real choice again: ride the corridor and thread traffic,
// or drop under it and share the valley with the worm. Over half the worm's
// surfacings are bluffs (bluffChance) — it rears, sways, and sinks without
// tracking — so the zone reads as something living under the dune rather than a
// damage metronome. Surface dressing in drawWormLair() (render/creatures.js).

registerLevel({
    name: "L6: The Sand Worm's Lair",
    missionTitle: "Amber Dusk — Sand Worm Extraction",
    description: "A colossal sand worm has colonised the central dune mound. Its burrows pit the whole slope and the bones of whatever it caught last are still up there. Collect cargo from the left-side shelf and get it east — the freight corridor runs low across the valley and the lanes are busy, so you can thread the traffic above the dunes or drop under it and cross the worm's ground instead. A dust ceiling caps the sky if you try to go over the top of both.",
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
    // Strictly an altitude cap, sitting well above everything the mission needs.
    // Clear at y:150, whiteout by y:-180 (render/fog.js). It starts ~280px above
    // the plateaus and ~370 above the mound peak, so flying the valley or the
    // pit never puts dust on screen — you only meet it by deliberately climbing
    // out of the level. fogBandDamage is grit abrasion at full density.
    fogBandBottomY: 150,
    fogBandTopY: -180,
    fogBandColor: '210,150,80',
    fogBandOpacity: 0.94,
    fogBandDamage: 3,

    // ── Freight traffic ───────────────────────────────────────────────────────
    // The lane sits in the crossing corridor, not up in the storm: trucks hold
    // `min(baseY, highestTerrainAhead - 140)`, so over the plateaus (y:430) they
    // clamp to ~290 — about 140px above the roofs, right where you actually fly
    // the high road. Over the mound and valley they ride up to 380. Rate 4 =>
    // up to 20 concurrent, with 4-8 pre-warmed at mission start.
    ambientTrafficRate: 4,
    ambientTrafficSpeed: 1.5,
    ambientTrafficMinY: 170,    // top of the lane (smaller Y = higher)
    ambientTrafficMaxY: 380,    // bottom — terrain clearance lifts it from here

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
    // Tuned down from the first difficulty pass, which made it too fast and too
    // relentless to read. It is now a presence you work around rather than a
    // reflex check:
    //   • The strike carries ~370px instead of ~600 (it homes for 6 frames at up
    //     to 30, then decay:0.86 bleeds it off), so it is slow enough to see
    //     coming and steer away from, and still lethal if you hover over sand.
    //   • Separating worm from traffic is done with the ZONE, not the arc: the
    //     mound sits close enough to the corridor that any leap worth watching
    //     would overshoot it. Instead the zone ceiling (y:387) sits below the
    //     lane, so flying the corridor never triggers a surfacing at all.
    //   • cooldownFrames:150 gives ~2.5s of quiet after it fully withdraws, so
    //     it submerges between appearances instead of running as a stream.
    //   • bluffChance:0.55 — over half of all surfacings are threat displays:
    //     it rears out of the sand, sways at the top of a short arc, and sinks
    //     back without ever tracking. The real lunges land because most of what
    //     you see is a bluff.
    // The surface dressing for this zone (burrow mouths, ribs, scoured sand) is
    // drawWormLair() in render/creatures.js, driven off this same hazard.
    hazards: [
        {
            type: 'sandworm',
            spawnRate: 1.0,
            proximityScale: 1.3,   // 2.3x risk directly over the peak vs the zone edge
            reach: 300,
            color: '200, 100, 20',
            period: 5400,
            trackFrames: 6,
            steer: 2.4,
            lungeSpeed: 24,
            maxSpeed: 30,
            decay: 0.86,
            retractSpeed: 13,
            hitRadius: 78,
            damage: 4.5,
            wormLength: 42,
            cooldownFrames: 150,
            bluffChance: 0.55,
            bluffSpeedScale: 0.62,  // rears ~105px clear of the sand — tall enough to read
            bluffHoldFrames: 34,
            comment: 'Worm danger zone (mound + the valley either side of it)',
            // Centroid (900, 687) — dropped from the old (900, 580) so the
            // 300px zone hugs the ground it should own (mound peak y:520, both
            // valley floors ~y:800) while its ceiling lands at y:387. That
            // ceiling is what keeps the corridor honest: crossing over the
            // mound at the lane's ~300 leaves you 387px from the centroid, i.e.
            // outside, so a corridor run never summons the worm. Dip toward the
            // sand and you are in its house.
            pts: [
                {x: 900, y: 420}, {x: 620, y: 820}, {x: 1180, y: 820}
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
    hint: "Two ways east. CORRIDOR: cross about 140px above the plateaus and you are in the freight lane — clear air, but the trucks are constant and they slow rather than stop, so watch for brake-lights and the honk. VALLEY: drop under the lane and run the low ground instead. That is the worm's territory; the sonar ring is the zone it can strike into, and hovering over the peak is what summons it. Most of what it does is bluff — it rears out of the sand, sways, and sinks back. The strike that follows a straight, silent surfacing is the one that hurts. Do not climb above the corridor to skip both: the dust ceiling blinds you and grinds the hull.",

    quests: [
        questPrimary('Deliver 2 cargo to Eastern Base'),
        questSurviveWorm(550),
        questQuick('Finish with 1+ min remaining', 60, 300),
    ],
});
