// Level 9 — The Cauldron
// Biome: Cavernous Void
// A highly chaotic level featuring a massive sandworm pit, high traffic, gravity anomalies,
// destructible buildings, acid lakes, and heavy weather.

registerLevel({
    name: "L9: The Cauldron",
    missionTitle: "The Cauldron — Absolute Chaos",
    description: "Welcome to The Cauldron. A massive sandworm has carved out a massive pit below the main thoroughfare. Acid lakes line the cavern, a gravity well is causing chaos, and ambient traffic is completely out of control. Your mission: recover 3 heavy cargo crates and drop them at the suspended delivery hub above the pit. Good luck.",

    // ── Physics ───────────────────────────────────────────────────────────────
    gravity: 0.18,           // Slightly heavier gravity
    wind: -2.5,              // Strong crosswind blowing left
    weather: 'snow',
    weatherParticles: 200,   // Heavy weather
    heavyCargo: true,
    ambientTrafficRate: 4,   // Maximum traffic frequency
    terrainType: 'worm-lair',// Enables the giant Sandworm hazard
    wormZoneR: 300,          // Range for worm to strike
    wormPitCX: 800,          // Center of the worm pit
    wormPitCY: 900,          // Bottom of the worm pit
    outOfBounds: true,       // Thick lateral fog on the sides

    // ── Quest Definition ─────────────────────────────────────────────────────
    targetCargo: 3,
    quests: [
        questPrimary("Deliver 3 cargo crates to the Suspended Hub"),
        questNoCrash(400),
        questNoCargoLost("Don't drop cargo in the acid", 500)
    ],

    // ── Terrain Polygons ──────────────────────────────────────────────────────
    terrainPolygons: [
        // Left starting shelf (HQ)
        [
            { x: -200, y: 600 }, { x: 300, y: 600 },
            { x: 300, y: 1200 }, { x: -200, y: 1200 }
        ],
        // Top cavern ceiling (left side)
        [
            { x: -200, y: 0 }, { x: 500, y: 0 },
            { x: 400, y: 350 }, { x: -200, y: 350 }
        ],
        // Top cavern ceiling (right side)
        [
            { x: 1100, y: 0 }, { x: 1800, y: 0 },
            { x: 1800, y: 350 }, { x: 1200, y: 350 }
        ],
        // The perilous Suspended Hub (floating rock in the middle)
        [
            { x: 700, y: 500 }, { x: 900, y: 500 },
            { x: 880, y: 540 }, { x: 720, y: 540 }
        ],
        // The Acid Pool rim (Right side)
        [
            { x: 1200, y: 700 }, { x: 1800, y: 700 },
            { x: 1800, y: 1200 }, { x: 1200, y: 1200 }
        ]
    ],

    // ── Water Bodies (Acid) ───────────────────────────────────────────────────
    waterBodies: [
        {
            x: 1250, y: 690, w: 500, h: 250,
            color: 'rgba(52, 211, 153, 0.4)', // Acid green
            surfaceColor: '#10b981',
            drag: 0.05,
            density: 0.003,
            isAcid: true
        }
    ],

    // ── Hazards ───────────────────────────────────────────────────────────────
    hazards: [
        // Pulsing Gravity Well above the acid pool pulling ships downwards
        { type: 'blackhole', x: 1500, y: 500, strength: 0.8, radius: 150, orbitRadius: 50 }
    ],

    // ── Segments (Obstacles) ──────────────────────────────────────────────────
    segments: [
        // Debris floating above the worm pit
        { x1: 500, y1: 700, x2: 550, y2: 720 },
        { x1: 1000, y1: 650, x2: 1080, y2: 680 }
    ],

    // ── Buildings ─────────────────────────────────────────────────────────────
    buildings: [
        // Destructible comms tower on the left shelf
        { x: 150, y: 600, type: 'comms', destructible: true, health: 50 },
        // Destructible silo near the acid
        { x: 1300, y: 700, type: 'silo', destructible: true, health: 80 }
    ],

    // ── Collectibles (Fuel / Cash) ────────────────────────────────────────────
    collectibles: [
        { type: 'cash', x: 800, y: 400, value: 500 }, // Risky cash above suspended hub
        { type: 'fuel', x: 525, y: 650, amount: 40 }, // Near debris
        { type: 'fuel', x: 1040, y: 600, amount: 40 } // Near debris
    ],

    // ── Setup & Spawns ────────────────────────────────────────────────────────
    startX: 0,               // Player starts on the left shelf
    defaultVehicle: 'lander',// Start with lander, though drone is highly recommended

    setupPhysics: function(physics) {
        // Create the Cargo Pickup Depot
        physics.createSourcingDepot(200, 600, 3, ['drone']); 
        
        // Delivery Hub is on the suspended rock above the worm. Needs to be 'heavy' type!
        physics.createDeliveryHub(800, 500, 3, 'heavy', 'Cauldron Hub', true);

        // Spawn 3 heavy crates on the left shelf inside the depot bounds
        for (let i = 0; i < 3; i++) {
            physics.spawnCargo('heavy', 170 + i * 30, '🏋️', 560);
            const box = physics.boxes[physics.boxes.length - 1];
            const body = physics.boxBodyMap.get(box.id);
            if (body) {
                Matter.Body.setDensity(body, 0.005);
            }
        }
    }
});
