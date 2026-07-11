// CargoLander — input bindings: keyboard/mouse listeners
// (setupEventListeners) and gamepad polling (pollGamepad).
// Touch joystick lives in index.html (setupJoystick), feeding game.keys too.
// Mixed onto CargoGame.prototype — loaded after game.js and BEFORE render.js
// (render.js instantiates window.game). Same pattern as render/*.js.

Object.assign(CargoGame.prototype, {

    setupEventListeners() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseLeft = false;
        this.mouseRight = false;

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.camera) return;
            const rect = this.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left - this.canvas.width / 2;
            const screenY = e.clientY - rect.top - this.canvas.height / 2;
            this.mouseX = (screenX / this.camera.zoom) + this.camera.x;
            this.mouseY = (screenY / this.camera.zoom) + this.camera.y;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                // Left click - Shoot firework
                if (this.gameState === 'playing' && this.physics && this.physics.lander && !this.physics.lander.crashed) {
                    this.shootPlayerFirework(this.physics.lander.x, this.physics.lander.y, this.mouseX, this.mouseY);
                }
            } else if (e.button === 2) {
                // Right click - Grapple (Drone action)
                if (this.physics && this.physics.lander && this.physics.lander.vehicleType === 'drone') {
                    if (this.physics.handleAction) this.physics.handleAction();
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            // Nothing needed for now
        });

        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        window.addEventListener('keydown', (e) => {
            // Don't hijack typing when a text field (e.g. the callsign input) is focused
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
                return;
            }
            this.keys[e.key.toLowerCase()] = true;
            // Prevent default scrolling for game keys
            if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
            if (e.key === ' ') {
                if (this.physics.lander) {
                    const level = levels[this.currentLevelIndex];
                    const allDelivered = level && this.deliveredCount >= level.targetCargo;
                    const atHQ = this.physics.lander.landed && this.physics.lander.currentPad === 'start';
                    if (this.gameState === 'playing' && allDelivered && atHQ) {
                        this.completeMission();
                    } else {
                        this.toggleGrapple();
                    }
                }
            }
            if (e.key.toLowerCase() === 'r' && this.physics.lander && this.physics.lander.crashed) {
                this.respawnLander();
            }
            if (e.key.toLowerCase() === 'h') {
                this.toggleUI();
            }
        });

        // Key up
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mobile touch controls (will bind HTML button events to keys in UI file)
        window.addEventListener('resize', () => this.resizeCanvas());
        // orientationchange fires slightly before resize on some mobile browsers —
        // listen to both so the rotate tip reacts as soon as possible.
        window.addEventListener('orientationchange', () => this.checkOrientationPrompt());

        // Gamepad (Xbox/standard-layout controller) support — see pollGamepad().
        window.addEventListener('gamepadconnected', (e) => {
            this.addMessage(`🎮 Controller connected: ${e.gamepad.id}`, '#34d399');
        });
        window.addEventListener('gamepaddisconnected', () => {
            this.addMessage('🎮 Controller disconnected', '#f8fafc');
        });
    },

    // Polled once per frame from update() — the Gamepad API has no button-press
    // events, only a live snapshot read via navigator.getGamepads(). Merges
    // directly into this.keys (same booleans the keyboard path sets) so the rest
    // of applyControls()/inputState needs no gamepad-specific branching, and
    // gamepad + keyboard can be used interchangeably frame to frame.
    pollGamepad() {
        const pads = navigator.getGamepads ? navigator.getGamepads() : null;
        if (!pads) return;
        let pad = null;
        for (const p of pads) { if (p) { pad = p; break; } }
        if (!pad) return;

        const DEAD_ZONE = 0.2;
        const stickX = pad.axes[0] || 0;
        const stickUp = -(pad.axes[1] || 0); // axes[1] is +1 down, we want +1 = up
        const rightTrigger = pad.buttons[7] ? pad.buttons[7].value : 0; // analog thrust
        const aBtn = pad.buttons[0] && pad.buttons[0].pressed;
        const bBtn = pad.buttons[1] && pad.buttons[1].pressed;

        this.keys['gp_left'] = stickX < -DEAD_ZONE;
        this.keys['gp_right'] = stickX > DEAD_ZONE;
        // Right trigger is the primary thrust input (analog on most pads); left
        // stick pushed up is the alternate for pads without analog triggers.
        this.keys['gp_up'] = rightTrigger > 0.1 || stickUp > DEAD_ZONE;

        // Edge-trigger A/B (fire once per press, not every frame held) so they
        // behave like the SPACE-key dispatch rather than a held-down key.
        if (aBtn && !this._gpAPrev) {
            const lander = this.physics.lander;
            if (lander) {
                const level = levels[this.currentLevelIndex];
                const allDelivered = level && this.deliveredCount >= level.targetCargo;
                const atHQ = lander.landed && lander.currentPad === 'start';
                if (this.gameState === 'playing' && allDelivered && atHQ) {
                    this.completeMission();
                } else {
                    this.toggleGrapple();
                }
            }
        }
        if (bBtn && !this._gpBPrev) {
            const lander = this.physics.lander;
            if (lander && lander.grabbedBoxId) {
                lander.grabbedBoxId = null;
                if (window.CargoAudio && !this.isMuted) CargoAudio.playLoad();
            }
        }
        this._gpAPrev = aBtn;
        this._gpBPrev = bBtn;
    },

});
