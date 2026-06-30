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
    terrainPolygons: [[{"x":-200,"y":920},{"x":-200,"y":920},{"x":0,"y":320},{"x":40,"y":320},{"x":80,"y":320},{"x":120,"y":320},{"x":160,"y":320},{"x":200,"y":320},{"x":240,"y":320},{"x":280,"y":320},{"x":320,"y":320},{"x":360,"y":320},{"x":400,"y":320},{"x":440,"y":320},{"x":480,"y":320},{"x":520,"y":320},{"x":560,"y":320},{"x":600,"y":320},{"x":640,"y":680},{"x":680,"y":680},{"x":720,"y":680},{"x":760,"y":680},{"x":800,"y":320},{"x":840,"y":320},{"x":880,"y":320},{"x":920,"y":320},{"x":960,"y":320},{"x":1000,"y":320},{"x":1040,"y":320},{"x":1080,"y":320},{"x":1120,"y":320},{"x":1160,"y":320},{"x":1200,"y":320},{"x":1240,"y":320},{"x":1280,"y":320},{"x":1480,"y":920},{"x":1480,"y":920}]],  // narrow shaft + cave ceiling; crystal formations underground

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
