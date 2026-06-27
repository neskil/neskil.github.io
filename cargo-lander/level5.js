// Level 5 — The Needle's Eye
// Biome: Crystal Caverns / Purple. Drone-only; lower cargo by winch into a narrow shaft.

registerLevel({
    name: "L5: The Needle's Eye",
    missionTitle: "Needle's Eye Precision Drop",
    description: "The hub is at the bottom of a shaft too narrow for your drone. Hover, extend your rope (E/Q), and lower cargo in!",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.10,          // lighter gravity — easier hovering for rope work
    wind: 0,

    // ── Terrain ───────────────────────────────────────────────────────────────
    terrainType: "needle",  // narrow shaft + cave ceiling; crystal formations underground

    // ── Mission parameters ────────────────────────────────────────────────────
    // No padScale — hub has explicit narrow width below
    targetCargo: 2,
    budget: 1800,
    timeLimit: 300,
    allowedTypes: ["normal"],
    collectionX: 180,       // cargo spawns further left so player must traverse

    // ── Hubs ──────────────────────────────────────────────────────────────────
    deliveryHubs: [
        { x: 700, width: 25, color: "#38bdf8", type: "normal", name: "The Pit" }
    ],

    // ── Palette (Crystal Caverns / Deep Purple) ───────────────────────────────
    palette: {
        skyTop:      '#040210',
        skyMid:      '#080420',
        skyBot:      '#0c0630',
        terrainFill: '#060418',
        rockEdge:    '#a855f7',
        rockGlow:    'rgba(168,85,247,',
        fog:         'rgba(168,85,247,0.08)',
    },

    // ── UI ────────────────────────────────────────────────────────────────────
    hint: "Hover over the shaft and lower cargo with the fixed rope. SPACE drops cargo. Return to HQ to extract.",

    quests: [
        questPrimary('Lower 2 cargo into The Pit'),
        questNoCargoLost('No cargo lost', 400),
        questQuick('Finish with 2+ min remaining', 120, 200),
    ],
});
