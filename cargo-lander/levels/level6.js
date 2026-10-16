// Level 6 — The Sand Worm's Lair
// Biome: Desert Dunes / Amber Dusk.
// Layout:
//   [1] HQ — upper-left plateau (startX: 80)
//   [2] Cargo pickup — lower-left valley shelf (collectionX: 200), near the lake
//   [3] Drop-off — upper-right plateau (Eastern Base hub at x:1460)
//   Lake — central depression; OOB water zone fills the valley floor
//   Worm Pit — raised central mound; a `sandworm`-type hazard polygon
//   (see hazards[] below) marks the AI spawn zone
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
//   y > 287   WORM ZONE. 400px around (900, 687): the mound, both valley
//             floors and the low edge of the corridor over the mound.
//
// ── 2026-10 viper rework ────────────────────────────────────────────────────
// Playtest verdict on the random-surfacing worm: "the sarlacc-pit style is not
// really working". It struck by dice roll from under wherever you hovered, so
// the only lesson was "don't be there". It is now a viper (behavior:'viper',
// see the hazards block): buried while you keep moving, rears and watches if
// you dawdle, pounces if you come close or linger, and misses if you are at
// full speed or change direction during its visible wind-up. Speed is the
// counterplay, which suits a level whose other hazards (traffic, gusts) are
// about not having to slow down. Surface dressing is drawWormLair() in
// render/creatures.js, driven off this same hazard.

registerLevel({
    name: "L6: The Sand Worm's Lair",
    missionTitle: "Amber Dusk — Sand Worm Extraction",
    description: "A colossal sand worm has colonised the central dune mound, and it hunts like a viper: it ignores anything moving fast, rears up at anything that dawdles, and strikes at whatever comes too close or stays too long. Collect cargo from the left-side shelf and get it east across its ground — through the busy freight corridor or low over the dunes. A dust ceiling caps the sky if you try to go over the top of both.",
    weather: 'heatwave',

    // ── Identity flag ─────────────────────────────────────────────────────────
    terrainType: 'worm-lair',

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.14,
    wind: 0.03,       // Storm-driven; the gust cycle below does the real work
    windForce: 6,     // ~215px hands-off drift per gust cycle
    heatHaze: true,
    // Gusts sell the storm and add a telegraphed, dodgeable pressure on the
    // crossing — the wind meter flashes amber through `warn` before each surge.
    windGust: { calm: 5, warn: 2, gust: 5, gustMult: 3.2 },

    // ── Dust storm ceiling ────────────────────────────────────────────────────
    // Strictly an altitude cap, sitting well above everything the mission needs.
    // It only shows on screen as you climb toward it (render/fog.js fades it by
    // the lander's altitude) — flying low, the sky stays clear.
    // Clear at y:150, whiteout by y:-180 (render/fog.js). It starts ~280px above
    // the plateaus and ~370 above the mound peak, so flying the valley or the
    // pit never puts dust on screen — you only meet it by deliberately climbing
    // out of the level. fogBandDamage is grit abrasion at full density.
    fogBandBottomY: 150,
    fogBandTopY: -180,
    fogBandColor: '210,150,80',
    fogBandOpacity: 0.75,   // was 0.94: a full whiteout read as too much; it is still murk
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
            {x: 160,  y: 430}, {x: 180,  y: 590}, {x: 192, y: 608}, {x: 308, y: 608}, {x: 350,  y: 640}, {x: 420,  y: 660},
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
    // behavior:'viper' — the worm is a predator you read, not a dice roll
    // (_updateViperWorm() in physics/atmosphere.js). It stays buried while you
    // keep moving through its ground. Dawdle and a threat meter fills (the
    // dunes stir, the sonar quickens) until it REARS out of the sand under your
    // path and sways there, watching. Come within strikeRange, or keep
    // loitering past `patience`, and it WINDS UP — head draws back, red ring,
    // a dashed line to the spot it locked onto — then POUNCES in a straight
    // line. It aims where your course takes you but can only read up to
    // leadMaxSpeed (2.2 px/frame) of it: hover or hold a slow course and it
    // meets you; go fast or change direction during the wind-up and it misses.
    //
    // Zone: 400px around the centroid (900, 687) — the mound, both valley
    // floors and the bottom of the freight corridor over the mound (ceiling
    // y:287). Both pads sit outside it, and so does anything parked on a pad.
    // The corridor overlap is deliberate: slowing down to let a truck by over
    // the dunes is now the risky move rather than a free one.
    //
    // Tuning, in frames (dt = 1 per 60fps frame):
    //   slowSpeed 1.6 / fastSpeed 3.4 px/frame — under 1.6 fills the meter
    //     fast, 1.6-3.4 slowly, over 3.4 drains it. Crossing the 800px zone at
    //     ~4 px/frame (an easy cruise) never wakes it; a 2 px/frame potter does.
    //   emergeThreat 50 — about half a second of hovering near the peak.
    //   patience 150 — 2.5s of watching before it strikes a loiterer.
    //   surfaceOffset 240 — it rears up beside you (ahead, if you're moving),
    //     never under you: the emergence is the warning, not the bite.
    //   strikeRange 170 / patience 150 — fly within 170px of the head and it
    //     strikes after a beat; stay slow in its ground for 2.5s and it
    //     strikes anyway. Patience only counts while you're under fastSpeed.
    //   windupFrames 28 / snapFrames 14 — ~0.47s tell (0.23s if you fly right
    //     into its face). A climb or dive covers ~120px in 28 frames, far
    //     more than the 46px hitRadius, so a reaction on the tell is enough.
    //   pounceDamage 34 — a third of a stock hull. Two bites and you're limping.
    hazards: [
        {
            type: 'sandworm',
            behavior: 'viper',
            reach: 400,
            color: '200, 100, 20',
            slowSpeed: 1.6,
            fastSpeed: 3.4,
            emergeThreat: 50,
            patience: 150,
            strikeRange: 170,
            surfaceOffset: 240,
            rearHeight: 150,
            maxRear: 260,
            windupFrames: 28,
            snapFrames: 14,
            pounceSpeed: 22,
            leadFactor: 1,
            leadMaxSpeed: 2.2,
            pounceDamage: 34,
            hitRadius: 46,
            wormLength: 42,
            cooldownFrames: 150,
            comment: 'Worm territory (mound, both valleys, low corridor over the mound)',
            // Centroid (900, 687); the burrow it surfaces from is clamped to
            // this triangle's x-span (650..1150 after a 30px margin).
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
    hint: "Keep moving over the dunes. The worm hunts what dawdles: hover or potter across its ground and the sand starts to stir, then it rears up and watches you. Get close or hang around and it draws back (red ring, dashed line) and pounces at the spot it locked onto — so change course on the tell (a hard climb or dive is surest) and it bites empty air. Parked on a pad you are safe. The freight corridor crosses low over the mound, so slowing for a truck up there is a risk too; climbing above the corridor puts you in the dust ceiling, which blinds you and grinds the hull.",

    quests: [
        questPrimary('Deliver 2 cargo to Eastern Base'),
        questSurviveWorm(550),
        questQuick('Finish with 1+ min remaining', 60, 300),
    ],
});
