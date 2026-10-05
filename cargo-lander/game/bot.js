// bot.js — Autonomous Flight Controller & Mission Test Bot for CargoLander
//
// Similar to golf's solver, this provides playability verification for the
// test suite and an in-game autopilot.
//
// Because CargoLander is a 60Hz continuous dynamical system (rather than golf's
// turn-based discrete impulse physics), a brute-force branching search is
// combinatorially intractable. Instead, CargoBot implements a closed-loop PD
// flight controller with thruster spool-up compensation, smooth kinematic braking curves,
// waypoint navigation along terrain-clearance corridors, and a mission state machine.

(function () {
    'use strict';

    class CargoBot {
        constructor(game) {
            this.game = game;
            this.reset();
        }

        reset() {
            this.state = 'INIT';
            this.subState = 'CLIMB'; // 'CLIMB', 'CRUISE', 'DESCEND'
            this.stateTimer = 0;
            this.targetPad = null;
            this.targetType = null;
            this.thrustActive = false;
        }

        // Get recommended inputs for the current frame
        getInputs() {
            const inputs = { up: false, down: false, left: false, right: false, q: false, e: false };
            const game = this.game;
            const phys = game.physics;
            const lander = phys.lander;

            if (!lander || lander.crashed) {
                return inputs;
            }

            const level = levels[game.currentLevelIndex];
            const targetCargo = level ? (level.targetCargo || 1) : 1;
            const isDrone = lander.vehicleType === 'drone';

            // High clearance cruising altitude: above terrain and ambient traffic lanes
            const startY = phys.startDepot.y;
            const colY = phys.collectionPoint.y;
            const hubYs = (phys.deliveryHubs || []).map(h => h.y);
            const lowestPadY = Math.min(startY, colY, ...hubYs);
            // Cruise at 80px altitude: clear of floating rock (y=290) and traffic lanes (y~280)
            const cruiseY = Math.min(80, lowestPadY - 240);

            this.stateTimer++;

            // Mission State Machine
            switch (this.state) {
                case 'INIT':
                    if (lander.landed) {
                        this.state = 'FLY_TO_DEPOT';
                        this.subState = 'CLIMB';
                        this.stateTimer = 0;
                    }
                    break;

                case 'FLY_TO_DEPOT': {
                    const pad = phys.collectionPoint;
                    const targetX = pad.x + pad.width / 2;
                    const targetY = pad.y - 12;

                    const arrived = this._flyWaypoint(lander, targetX, targetY, cruiseY, isDrone, inputs);
                    if (arrived && lander.landed && lander.currentPad === 'collection') {
                        this.state = 'LOAD_CARGO';
                        this.stateTimer = 0;
                    }
                    break;
                }

                case 'LOAD_CARGO': {
                    // Wait for cargo to spawn and seat on deck (or be grappled)
                    // Cut all flight inputs while parked
                    const targetLoad = isDrone ? 1 : Math.min(2, targetCargo - game.deliveredCount);
                    const loadedCount = phys.boxes.filter(b => b.onDeck || b.id === lander.grabbedBoxId).length;
                    if (loadedCount >= targetLoad || (loadedCount > 0 && this.stateTimer > 280)) {
                        this.state = 'FLY_TO_HUB';
                        this.subState = 'CLIMB';
                        this.stateTimer = 0;
                    }
                    break;
                }

                case 'FLY_TO_HUB': {
                    // Find matching delivery hub for held cargo
                    const heldBox = phys.boxes.find(b => b.onDeck || b.id === lander.grabbedBoxId);
                    const cargoType = heldBox ? heldBox.type : 'normal';
                    let hub = phys.deliveryHubs.find(h => h.type === cargoType) || phys.deliveryHubs[0];
                    if (!hub) hub = phys.deliveryHubs[0];

                    // Aim for left-center of hub pad (avoids any right-side rock overhangs like L1)
                    const targetX = hub.x + Math.min(38, hub.width / 2);
                    const targetY = hub.y - 12;

                    const arrived = this._flyWaypoint(lander, targetX, targetY, cruiseY, isDrone, inputs);
                    if (arrived && lander.landed && (lander.currentPad === hub.type || lander.currentPad !== null)) {
                        this.state = 'UNLOAD_CARGO';
                        this.stateTimer = 0;
                    }
                    break;
                }

                case 'UNLOAD_CARGO': {
                    // Parked on hub, wait for delivery payout to register
                    if (game.deliveredCount >= targetCargo) {
                        this.state = 'RETURN_TO_HQ';
                        this.subState = 'CLIMB';
                        this.stateTimer = 0;
                    } else if (this.stateTimer > 70) {
                        // More deliveries needed: return to depot for next crate
                        this.state = 'FLY_TO_DEPOT';
                        this.subState = 'CLIMB';
                        this.stateTimer = 0;
                    }
                    break;
                }

                case 'RETURN_TO_HQ': {
                    const pad = phys.startDepot;
                    const targetX = pad.x + pad.width / 2;
                    const targetY = pad.y - 12;

                    const arrived = this._flyWaypoint(lander, targetX, targetY, cruiseY, isDrone, inputs);
                    if (arrived && lander.landed && lander.currentPad === 'start') {
                        this.state = 'MISSION_COMPLETE';
                        game.completeMission(true);
                    }
                    break;
                }

                case 'MISSION_COMPLETE':
                    // Mission completed successfully
                    break;
            }

            return inputs;
        }

        // Navigates in 3 phases: Climb to cruise altitude -> Transit -> Descend & Flare
        _flyWaypoint(lander, padX, padY, cruiseY, isDrone, inputs) {
            const dx = padX - lander.x;

            if (this.subState === 'CLIMB') {
                // Climb until we clear terrain and reach cruising altitude
                if (lander.y <= cruiseY + 25) {
                    this.subState = 'CRUISE';
                } else {
                    this._guide(lander, lander.x, cruiseY, false, isDrone, inputs);
                    return false;
                }
            }

            if (this.subState === 'CRUISE') {
                // Transit horizontally at cruise altitude; decelerate smoothly to pad position
                if (Math.abs(dx) < 14 && Math.abs(lander.vx) < 0.6) {
                    this.subState = 'DESCEND';
                } else {
                    this._guide(lander, padX, cruiseY, false, isDrone, inputs);
                    return false;
                }
            }

            if (this.subState === 'DESCEND') {
                // Line up horizontally and descend softly onto pad
                this._guide(lander, padX, padY, true, isDrone, inputs);
                return lander.landed;
            }

            return false;
        }

        // Closed-loop PD Flight Controller with kinematic square-root braking curves
        _guide(lander, targetX, targetY, isLanding, isDrone, inputs) {
            const dx = targetX - lander.x;
            const dy = targetY - lander.y; // positive = target is lower down

            // --- Horizontal Control ---
            // Square-root deceleration curve: v* = sqrt(2 * a * distance)
            const maxCruiseVx = 3.5;
            let desiredVx;
            if (isLanding) {
                if (Math.abs(dx) > 30) {
                    desiredVx = Math.sign(dx) * Math.min(1.8, Math.sqrt(0.12 * Math.abs(dx)));
                } else if (Math.abs(dx) > 6) {
                    desiredVx = Math.sign(dx) * Math.min(0.8, Math.sqrt(0.08 * Math.abs(dx)));
                } else {
                    desiredVx = Math.sign(dx) * 0.2;
                }
            } else {
                // Cruising: decelerate smoothly when within 90px of target
                desiredVx = Math.sign(dx) * Math.min(maxCruiseVx, Math.sqrt(0.14 * Math.abs(dx)));
            }

            const vxErr = desiredVx - lander.vx;
            if (isDrone) {
                if (vxErr > 0.08) inputs.right = true;
                else if (vxErr < -0.08) inputs.left = true;
            } else {
                if (vxErr > 0.07) inputs.right = true;
                else if (vxErr < -0.07) inputs.left = true;
            }

            // --- Vertical Control ---
            let desiredVy;
            if (isLanding) {
                // If not yet centered over pad, hold pattern ~50px above pad surface
                if (Math.abs(dx) > 20) {
                    const patternY = targetY - 55;
                    const dyPattern = patternY - lander.y;
                    desiredVy = Math.max(-2.5, Math.min(0.8, dyPattern * 0.08));
                } else {
                    // Aligned! Settle gently (flare at touchdown)
                    if (dy > 35) desiredVy = 1.1;
                    else if (dy > 12) desiredVy = 0.75;
                    else desiredVy = 0.40; // Touchdown flare (< 2.0 maxLandingSpeed)
                }
            } else {
                // Cruise / climb
                if (dy < 0) {
                    // Climbing: cap climb rate to -3.2
                    desiredVy = Math.max(-3.2, dy * 0.10);
                } else {
                    // Sinking: cap descent rate to +2.5
                    desiredVy = Math.min(2.5, Math.sqrt(0.12 * dy));
                }
            }

            if (isDrone) {
                if (lander.vy > desiredVy + 0.08) inputs.up = true;
                else if (lander.vy < desiredVy - 0.25) inputs.down = true;
            } else {
                // Basic lander has thruster spool-up (~17 frames) and instant cut.
                // We use hysteresis to prevent rapid flickering that resets enginePower.
                const vyErr = lander.vy - desiredVy;
                if (this.thrustActive) {
                    // Stay on until we have arrested downward velocity
                    if (vyErr < -0.20) {
                        this.thrustActive = false;
                    }
                } else {
                    // Engage thrust as soon as vertical velocity exceeds target
                    if (vyErr > -0.02) {
                        this.thrustActive = true;
                    }
                }
                inputs.up = this.thrustActive;

                // Descent booster if we need to descend much faster
                if (!inputs.up && vyErr < -1.8 && dy > 30) {
                    inputs.down = true;
                }
            }

            // Predictive traffic radar: detect closing ambient trucks within 220px lookahead
            if (this.game.physics.ambientTraffic && this.game.physics.ambientTraffic.length > 0) {
                for (const t of this.game.physics.ambientTraffic) {
                    const tx = t.x + (t.w || 30) / 2;
                    const dx = lander.x - tx;
                    const relVx = (t.vx || 0) - (lander.vx || 0);
                    // Is the truck heading towards the lander?
                    const isClosing = (relVx > 0 && dx > 0) || (relVx < 0 && dx < 0);
                    const dist = Math.abs(dx);
                    const vertDist = Math.abs(t.y - lander.y);

                    if (isClosing && dist < 220 && vertDist < 60) {
                        // Conflict predicted!
                        if (t.y >= lander.y) {
                            // Truck is at or below our altitude: climb vigorously to clear
                            inputs.up = true;
                            inputs.down = false;
                        } else {
                            // Truck is above us: cut climb and wait below
                            inputs.up = false;
                        }
                    }
                }
            }
        }

        // Headless execution: steps simulation synchronously until mission completes or frame limit is reached
        static simulateMission(game, levelIndex, maxFrames = 3000, opts = {}) {
            game.startLevel(levelIndex);
            if (opts.clearTraffic) {
                game.physics.ambientTraffic = [];
                game.physics.trafficSpawnTimer = -999999;
            }
            const bot = new CargoBot(game);

            let frame = 0;
            for (; frame < maxFrames; frame++) {
                if (opts.clearTraffic && game.physics.ambientTraffic) {
                    game.physics.ambientTraffic.length = 0;
                }
                if (game.gameState === 'level_complete') break;
                if (game.physics.lander && game.physics.lander.crashed) break;

                const botInputs = bot.getInputs();
                game.keys = {
                    arrowup: botInputs.up,
                    arrowdown: botInputs.down,
                    arrowleft: botInputs.left,
                    arrowright: botInputs.right,
                    q: botInputs.q,
                    e: botInputs.e,
                };

                game.update(1.0);
            }

            return {
                completed: game.gameState === 'level_complete',
                frames: frame,
                crashed: game.physics.lander ? game.physics.lander.crashed : true,
                delivered: game.deliveredCount,
                finalState: bot.state,
                budget: game.missionBudget
            };
        }
    }

    // Expose globally
    if (typeof window !== 'undefined') {
        window.CargoBot = CargoBot;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CargoBot;
    }
})();
