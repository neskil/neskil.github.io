// levelGenerator.js — Procedural Mission Generator
// Generates random levels with stitched terrain, randomized hubs, and dynamic palettes.

const BIOMES = [
    {
        name: "Grasslands",
        palette: { skyTop: '#25338fff', skyMid: '#13294aff', skyBot: '#0f2512ff', terrainFill: '#020802', rockEdge: '#4ade80', rockGlow: 'rgba(74,222,128,', fog: 'rgba(74,222,128,0.04)' }
    },
    {
        name: "Desert Wastes",
        palette: { skyTop: '#4a1505', skyMid: '#2e0f06', skyBot: '#0a0301', terrainFill: '#0a0301', rockEdge: '#f59e0b', rockGlow: 'rgba(245,158,11,', fog: 'rgba(245,158,11,0.04)' }
    },
    {
        name: "Arctic Expanse",
        palette: { skyTop: '#0a192f', skyMid: '#112240', skyBot: '#020c1b', terrainFill: '#010613', rockEdge: '#38bdf8', rockGlow: 'rgba(56,189,248,', fog: 'rgba(56,189,248,0.04)' }
    },
    {
        name: "Volcanic Zone",
        palette: { skyTop: '#3a0808', skyMid: '#1a0303', skyBot: '#050000', terrainFill: '#050000', rockEdge: '#ef4444', rockGlow: 'rgba(239,68,68,', fog: 'rgba(239,68,68,0.04)' }
    },
    {
        name: "Crystal Caverns",
        palette: { skyTop: '#1e0a2b', skyMid: '#12041c', skyBot: '#06010a', terrainFill: '#06010a', rockEdge: '#a855f7', rockGlow: 'rgba(168,85,247,', fog: 'rgba(168,85,247,0.04)' }
    }
];

const CARGO_TYPES = ['normal', 'red', 'blue', 'green'];
const HUB_COLORS = { 'normal': '#38bdf8', 'red': '#ef4444', 'blue': '#3b82f6', 'green': '#10b981' };

let proceduralLevelCount = 0;

function generateProceduralLevel() {
    proceduralLevelCount++;
    const biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    
    // Generate mission params
    const gravity = 0.10 + (Math.random() * 0.06); // 0.10 to 0.16
    const wind = (Math.random() - 0.5) * 0.002;
    const targetCargo = 2 + Math.floor(Math.random() * 3); // 2 to 4 boxes
    const budget = 500 + Math.floor(Math.random() * 1000);
    const timeLimit = 120 + Math.floor(Math.random() * 120);

    // Build terrain
    let pts = [];
    // Start way left and high
    pts.push({ x: -1000, y: 0 });
    pts.push({ x: -1000, y: 700 });
    
    let currentX = -1000;
    let currentY = 700;
    
    // We need flat pads for: StartHQ, Collection, and 1-2 Hubs.
    // Let's place them at specific X ranges.
    const pads = [
        { xMin: -300, xMax: -100, label: 'hq', width: 250 },
        { xMin: 200,  xMax: 400,  label: 'collection', width: 250 },
        { xMin: 900,  xMax: 1100, label: 'hub1', width: 200 },
        { xMin: 1600, xMax: 1800, label: 'hub2', width: 200 }
    ];
    
    let activePad = 0;
    let nextPadX = pads[activePad].xMin + Math.random() * (pads[activePad].xMax - pads[activePad].xMin);
    
    let hqX = 0, collectionX = 0;
    let hubs = [];
    
    while (currentX < 2500) {
        if (activePad < pads.length && currentX >= nextPadX) {
            // Draw flat pad
            currentY = currentY + (Math.random() - 0.5) * 100; // Step to pad height
            pts.push({ x: currentX, y: currentY });
            let endX = currentX + pads[activePad].width;
            pts.push({ x: endX, y: currentY });
            
            // Record pad center
            let centerX = currentX + pads[activePad].width / 2;
            if (pads[activePad].label === 'hq') hqX = centerX;
            if (pads[activePad].label === 'collection') collectionX = centerX;
            if (pads[activePad].label.startsWith('hub')) {
                // Random cargo type for this hub
                let type = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
                hubs.push({ x: centerX, color: HUB_COLORS[type], type: type, name: `Outpost ${Math.floor(Math.random()*999)}` });
            }
            
            currentX = endX;
            activePad++;
            if (activePad < pads.length) {
                nextPadX = pads[activePad].xMin + Math.random() * (pads[activePad].xMax - pads[activePad].xMin);
                // Ensure next pad is after currentX
                if (nextPadX < currentX + 100) nextPadX = currentX + 100 + Math.random() * 200;
            }
        } else {
            // Random walk terrain
            let stepX = 50 + Math.random() * 100;
            currentX += stepX;
            let stepY = (Math.random() - 0.5) * 200;
            
            // Prevent going too high or low
            if (currentY + stepY < 300) stepY = Math.abs(stepY); // Push down
            if (currentY + stepY > 900) stepY = -Math.abs(stepY); // Push up
            
            currentY += stepY;
            pts.push({ x: currentX, y: currentY });
        }
    }
    
    // Finish polygon
    pts.push({ x: 3000, y: currentY });
    pts.push({ x: 3000, y: 2000 });
    pts.push({ x: -1000, y: 2000 });
    
    let hubTypes = hubs.map(h => h.type);
    
    // OOB zone
    let oob = {
        type: 'water',
        color: 'rgba(239, 68, 68, 0.2)',
        mistColor: 'rgba(239, 68, 68, 0.1)',
        surfaceY: 1300,
        drag: 0.95,
        buoyancy: -0.1,
        monsterDepth: 1500
    };

    return {
        name: `Mission ♾️ · Endless`,
        missionTitle: `Sector ${Math.floor(Math.random() * 9999)} — ${biome.name}`,
        description: `A procedurally generated delivery contract in the ${biome.name}. Unpredictable terrain and weather conditions. Be careful out there, pilot.`,
        gravity: Number(gravity.toFixed(3)),
        wind: Number(wind.toFixed(4)),
        startX: Math.floor(hqX),
        collectionX: Math.floor(collectionX),
        terrainPolygons: [pts],
        waterBodies: [],
        padScale: 1.0,
        targetCargo: targetCargo,
        budget: budget,
        timeLimit: timeLimit,
        allowedTypes: hubTypes.length > 0 ? hubTypes : ['normal'],
        outOfBounds: oob,
        deliveryHubs: hubs,
        palette: biome.palette,
        hint: "This sector was procedurally generated. Expect the unexpected.",
        quests: [
            questPrimary(`Deliver ${targetCargo} cargo to destination hubs`),
            questNoCrash(250)
        ]
    };
}
