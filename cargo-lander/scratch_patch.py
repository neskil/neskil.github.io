import re

# 1. Patch game.js
with open("game.js", "r", encoding="utf-8") as f:
    game = f.read()

game = game.replace(
"""    startLevel(idx, vehicleType = this.currentVehicle || 'basic') {
        if (idx === 'random') {
            const procLvl = typeof generateProceduralLevel === 'function' ? generateProceduralLevel() : null;""",
"""    startLevel(idx, vehicleType = this.currentVehicle || 'basic') {
        let craziness = 1;
        if (typeof idx === 'string' && idx.startsWith('random')) {
            craziness = parseInt(idx.replace('random', '')) || 1;
            const procLvl = typeof generateProceduralLevel === 'function' ? generateProceduralLevel(craziness) : null;"""
)
game = game.replace(
"""        if (levels[this.currentLevelIndex] && levels[this.currentLevelIndex].name.includes('Mission ??')) {
            this.startLevel('random');
        } else if (this.currentLevelIndex + 1 < levels.length) {""",
"""        if (levels[this.currentLevelIndex] && levels[this.currentLevelIndex].name.includes('Mission ??')) {
            this.startLevel('random' + (levels[this.currentLevelIndex].craziness || 1));
        } else if (this.currentLevelIndex + 1 < levels.length) {"""
)
# Restore the phase bug I introduced earlier
game = game.replace("seed: Math.random()", "phase: Math.random() * Math.PI * 2")

with open("game.js", "w", encoding="utf-8") as f:
    f.write(game)

# 2. Patch index.html
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

old_btn = """                        <button class="btn-level" onclick="game.showVehicleSelection('random')"
                            style="border-color: #4ade80;">
                            <span class="num" style="color: #4ade80;">♾️ Mission ♾️ · Endless</span>
                            Procedural Sector
                            <span style="font-size:0.65rem; color:#4ade80; font-weight:600; margin-top:2px;">Infinite
                                Replay</span>
                        </button>"""

new_btns = """                        <button class="btn-level" onclick="game.showVehicleSelection('random1')"
                            style="border-color: #4ade80; margin-bottom: 8px;">
                            <span class="num" style="color: #4ade80;">♾️ Mission ♾️ · Endless</span>
                            Procedural Normal
                            <span style="font-size:0.65rem; color:#4ade80; font-weight:600; margin-top:2px;">Standard Generation</span>
                        </button>
                        <button class="btn-level" onclick="game.showVehicleSelection('random2')"
                            style="border-color: #f59e0b; margin-bottom: 8px;">
                            <span class="num" style="color: #f59e0b;">♾️ Mission ♾️ · Endless</span>
                            Procedural Crazy
                            <span style="font-size:0.65rem; color:#f59e0b; font-weight:600; margin-top:2px;">More Hazards & Length</span>
                        </button>
                        <button class="btn-level" onclick="game.showVehicleSelection('random3')"
                            style="border-color: #f43f5e;">
                            <span class="num" style="color: #f43f5e;">♾️ Mission ♾️ · Endless</span>
                            Procedural Insane
                            <span style="font-size:0.65rem; color:#f43f5e; font-weight:600; margin-top:2px;">Extreme Challenge</span>
                        </button>"""
html = html.replace(old_btn, new_btns)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

# 3. Patch physics.js
with open("physics.js", "r", encoding="utf-8") as f:
    physics = f.read()

physics = physics.replace("this.gravity = 0.05;", "this.gravity = 0.035;")
physics = physics.replace("this.gravity = levelConfig.gravity !== undefined ? levelConfig.gravity : 0.05;", "this.gravity = levelConfig.gravity !== undefined ? levelConfig.gravity : 0.035;")
physics = physics.replace(
"""        // Track how far out we are for the vignette warning (1000px ~ 1 screen)
        const VIGNETTE_MARGIN = 1000;
        if (lander.x < -VIGNETTE_MARGIN || lander.x > this.levelWidth + VIGNETTE_MARGIN || lander.y < -VIGNETTE_MARGIN) {""",
"""        // Track how far out we are for the vignette warning (1000px ~ 1 screen)
        const VIGNETTE_MARGIN = 1000;
        if (lander.x < -VIGNETTE_MARGIN || lander.x > this.levelWidth + VIGNETTE_MARGIN || lander.y < -500) {"""
)

with open("physics.js", "w", encoding="utf-8") as f:
    f.write(physics)

# 4. Patch levelGenerator.js
with open("levelGenerator.js", "r", encoding="utf-8") as f:
    lg = f.read()

old_gen = """function generateProceduralLevel() {
    proceduralLevelCount++;
    const biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    
    // Generate mission params
    const gravity = 0.10 + (Math.random() * 0.06); // 0.10 to 0.16
    const wind = (Math.random() - 0.5) * 0.002;
    const targetCargo = 2 + Math.floor(Math.random() * 3); // 2 to 4 boxes
    const budget = 500 + Math.floor(Math.random() * 1000);
    const timeLimit = 120 + Math.floor(Math.random() * 120);"""

new_gen = """function generateProceduralLevel(craziness = 1) {
    proceduralLevelCount++;
    const biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
    
    let targetLength = 2500;
    let targetCargo = 2;
    let budget = 1000;
    let timeLimit = 180;
    let gravity = 0.035;
    let wind = 0;
    
    if (craziness === 1) {
        targetLength = 2500 + Math.random() * 1000;
        targetCargo = 2 + Math.floor(Math.random() * 2);
        budget = 800 + Math.random() * 500;
        timeLimit = 180 + Math.random() * 60;
        gravity = 0.035 + Math.random() * 0.01;
        wind = (Math.random() - 0.5) * 0.0005;
    } else if (craziness === 2) {
        targetLength = 4000 + Math.random() * 2000;
        targetCargo = 3 + Math.floor(Math.random() * 3);
        budget = 1500 + Math.random() * 500;
        timeLimit = 240 + Math.random() * 120;
        gravity = 0.04 + Math.random() * 0.02;
        wind = (Math.random() - 0.5) * 0.002;
    } else if (craziness === 3) {
        targetLength = 6000 + Math.random() * 4000;
        targetCargo = 5 + Math.floor(Math.random() * 4);
        budget = 2500 + Math.random() * 1000;
        timeLimit = 360 + Math.random() * 180;
        gravity = 0.05 + Math.random() * 0.04;
        wind = (Math.random() - 0.5) * 0.004;
    }"""

lg = lg.replace(old_gen, new_gen)

lg = lg.replace("while (currentX < 2500) {", "while (currentX < targetLength) {")
lg = lg.replace("return {", "return {\\n        craziness,")

with open("levelGenerator.js", "w", encoding="utf-8") as f:
    f.write(lg)

print("Patch applied")
