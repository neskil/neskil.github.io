// dev-tools.js
// Binds HTML UI to game engine parameters

document.addEventListener('DOMContentLoaded', () => {
    const sliderGravity = document.getElementById('gravitySlider');
    const sliderThrust = document.getElementById('thrustSlider');
    const btnReload = document.getElementById('btnReloadLevel');
    const btnDebug = document.getElementById('btnDebugDraw');
    
    if (sliderGravity) {
        sliderGravity.addEventListener('input', (e) => {
            Physics.setGravity(parseFloat(e.target.value));
        });
    }
    
    if (sliderThrust) {
        sliderThrust.addEventListener('input', (e) => {
            if(Game) Game.thrustPower = parseFloat(e.target.value);
        });
    }
    
    if (btnReload) {
        btnReload.addEventListener('click', () => {
            if(Game && Game.running) {
                Game.running = false;
                Game.start();
            }
        });
    }
    
    if (btnDebug) {
        btnDebug.addEventListener('click', () => {
            if(Game) Game.debugDraw = !Game.debugDraw;
        });
    }
});
