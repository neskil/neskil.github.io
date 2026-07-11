// CargoLander — cargo delivery & mission economy: hub/chute delivery checks
// (checkCargoDelivery), cargo removal (removeCargoBox — the ONLY correct way
// to delete a box), delivery payouts, box fire state, delivery/explosion FX.
// Mixed onto CargoGame.prototype — loaded after game.js and BEFORE render.js
// (render.js instantiates window.game). Same pattern as render/*.js.

Object.assign(CargoGame.prototype, {

    checkCargoDelivery() {
        const lander = this.physics.lander;
        const hubs = this.physics.deliveryHubs;
        const boxes = this.physics.boxes;
        
        let totalReward = 0;
        let lastDeliveryX = 0;
        let lastDeliveryY = 0;

        // Check for deliveries on all pads (either landed by lander or dropped manually)
        for (const hub of hubs) {
            for (let i = boxes.length - 1; i >= 0; i--) {
                const box = boxes[i];
                
                // Vacuum chute logic
                if (hub.type === 'chute') {
                    if (box.x >= hub.x && box.x <= hub.x + hub.width && box.y > hub.y + 20) {
                        totalReward += this.processSuccessfulDelivery(box, i, hub);
                        lastDeliveryX = hub.x + hub.width / 2;
                        lastDeliveryY = hub.y - 20;
                    }
                    continue;
                }

                // Normal pad delivery
                if (box.x >= hub.x - 30 && box.x <= hub.x + hub.width + 30 && box.y > hub.y - 60) {
                    // Two ways to deliver: 
                    // 1) Lander is landed on the hub, and box is near it.
                    // 2) Box is just resting on the hub by itself.
                    const landerIsHere = lander.landed && lander.currentPad === hub.type;
                    const boxIsResting = (!box.onDeck && lander.grabbedBoxId !== box.id && box.y > hub.y - 40 && Math.abs(box.vx || 0) < 1.0 && Math.abs(box.vy || 0) < 1.0);
                    
                    if (landerIsHere || boxIsResting) {
                        if (box.type === hub.type) {
                            totalReward += this.processSuccessfulDelivery(box, i, hub);
                            lastDeliveryX = box.x;
                            lastDeliveryY = box.y;
                        } else if (!box._rejectWarned) {
                            box._rejectWarned = true;
                            this.addMessage(`Warning: Hub rejects ${box.type.toUpperCase()} package!`, "#ef4444");
                        }
                    }
                }
            }
        }
        
        if (totalReward > 0) {
            if (!this.floatingTexts) this.floatingTexts = [];
            const ox = (Math.random() - 0.5) * 40;
            const oy = (Math.random() - 0.5) * 20;
            this.floatingTexts.push({ text: `+$${totalReward}`, x: lastDeliveryX + ox, y: lastDeliveryY - 40 + oy, life: 1.5, color: '#10b981' });
        }

        // Check if any cargo fell into the abyss, or has gone stale from neglect
        for (let i = boxes.length - 1; i >= 0; i--) {
            const box = boxes[i];

            // Physics flags boxes destroyed by lasers (box.lost) but can't remove
            // them itself — finish the removal here so the Matter body and any
            // grapple state are cleaned up through removeCargoBox().
            if (box.lost) {
                this.removeCargoBox(box, i);

                this.missionBudget -= 200;
                this.cargoLostCount++;
                if (this.questState['no_cargo_lost'] === undefined) {
                    this.questState['no_cargo_lost'] = { failed: true };
                }
                this.addMessage("Cargo vaporized by laser! -$200 Budget", "#ef4444");

                if (this.missionBudget < 0) {
                    this.failMission("Bankrupt! Too much cargo lost.");
                }
                continue;
            }

            const terrainY = this.physics.getPolygonSurfaceY(box.x);

            // If box fell below the terrain height by a buffer, or off screen bottom
            if (box.y > terrainY + 50 || box.y > this.physics.levelHeight) {
                // Spawn smoke particles
                this.spawnDeliveryParticles(box.x, terrainY, "#475569");
                this.removeCargoBox(box, i);

                // Penalize Mission Budget
                this.missionBudget -= 200;
                this.cargoLostCount++;
                if (this.questState['no_cargo_lost'] === undefined) {
                    this.questState['no_cargo_lost'] = { failed: true };
                }
                this.addMessage("Cargo Lost! -$200 Budget", "#ef4444");

                if (this.missionBudget < 0) {
                    this.failMission("Bankrupt! Too much cargo lost.");
                }
                continue;
            }

            // Cargo left sitting unclaimed for ~1 minute goes unstable and blows up —
            // discourages hoarding boxes on the deck or leaving them scattered forever.
            const isHeld = box.onDeck || (lander && lander.grabbedBoxId === box.id);
            if (!isHeld && (box.age || 0) > 3600) {
                for (let p = 0; p < 24; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 1 + Math.random() * 4;
                    this.physics.particles.push({
                        x: box.x, y: box.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 1,
                        life: 1.0,
                        decay: 0.02 + Math.random() * 0.03,
                        color: Math.random() < 0.6 ? `hsla(${15 + Math.random() * 25}, 100%, 55%, 0.9)` : '#475569',
                        size: 5 + Math.random() * 7
                    });
                }
                if (window.CargoAudio && !this.isMuted) CargoAudio.playCrash();
                this.removeCargoBox(box, i);

                this.missionBudget -= 200;
                this.cargoLostCount++;
                if (this.questState['no_cargo_lost'] === undefined) {
                    this.questState['no_cargo_lost'] = { failed: true };
                }
                this.addMessage("Cargo went stale and exploded! -$200 Budget", "#f97316");

                if (this.missionBudget < 0) {
                    this.failMission("Bankrupt! Too much cargo lost.");
                }
            }
        }
    },

    // Removes a box from the simulation: detaches it from the lander if held,
    // drops its Matter body (otherwise it lingers in the world and keeps
    // colliding/simulating invisibly), and splices it out of physics.boxes.
    removeCargoBox(box, index) {
        const lander = this.physics.lander;
        if (lander && lander.grabbedBoxId === box.id) {
            lander.grabbedBoxId = null;
        }
        const body = this.physics.boxBodyMap?.get(box.id);
        if (body) {
            Matter.Composite.remove(this.physics.matterWorld, body);
            this.physics.boxBodyMap.delete(box.id);
        }
        this.physics.boxes.splice(index, 1);
    },

    processSuccessfulDelivery(box, index, hub) {
        this.spawnDeliveryParticles(box.x, box.y, hub.color);
        this.removeCargoBox(box, index);
        hub.craneAnim = { timer: 0, lx: box.x, ly: box.y, boxType: box.type };

        this.deliveredCount++;
        this.career.totalDeliveries++;
        this.saveCareer();
        
        const deliveryReward = 300;
        this.missionBudget += deliveryReward; // Add directly to mission ledger
        this.addMessage(`Delivery Complete! +$${deliveryReward}`, "#10b981");

        if (window.CargoAudio && !this.isMuted) CargoAudio.playUnload();
        
        return deliveryReward;
    },

    updateBoxFireState(dt) {
        const boxes = this.physics.boxes;
        if (!boxes.length) return;
        const cp = this.physics.collectionPoint;
        const sd = this.physics.startDepot;

        for (let i = boxes.length - 1; i >= 0; i--) {
            const box = boxes[i];
            if (box.onDeck) { box.fireTimer = 0; continue; }

            // Safe pads: collection point, start depot, delivery hubs
            const onSafe =
                (cp && box.x >= cp.x - 20 && box.x <= cp.x + cp.width + 20 && Math.abs(box.y - cp.y) < 50) ||
                (sd && box.x >= sd.x - 20 && box.x <= sd.x + sd.width + 20 && Math.abs(box.y - sd.y) < 50) ||
                this.physics.deliveryHubs.some(h => box.x >= h.x - 20 && box.x <= h.x + h.width + 20 && box.y > h.y - 50);

            if (onSafe) { box.fireTimer = 0; continue; }

            // Box is loose on terrain — accumulate fire timer when mostly settled
            const speed = Math.sqrt(box.vx * box.vx + box.vy * box.vy);
            if (speed < 2) {
                box.fireTimer = (box.fireTimer || 0) + dt;
            } else {
                box.fireTimer = Math.max(0, (box.fireTimer || 0) - dt);
            }

            // Explode after ~3 seconds of burning (180 frames at 60fps)
            if (box.fireTimer > 180) {
                // Explosion particles
                for (let p = 0; p < 30; p++) {
                    const angle = Math.random() * Math.PI * 2;
                    const spd = 2 + Math.random() * 8;
                    this.physics.particles.push({
                        x: box.x, y: box.y,
                        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 2,
                        life: 0.9 + Math.random() * 0.1,
                        decay: 0.025 + Math.random() * 0.02,
                        size: 2 + Math.random() * 4,
                        color: ['#f97316', '#ef4444', '#fbbf24', '#94a3b8'][Math.floor(Math.random() * 4)],
                    });
                }
                if (window.CargoAudio && !this.isMuted) CargoAudio.playCollision();
                this.addMessage('Cargo destroyed! -$150', '#ef4444');
                this.missionBudget -= 150;
                this.removeCargoBox(box, i);
            }
        }
    },

    spawnDeliveryParticles(x, y, color) {
        const isSuccess = color !== "#475569";
        const count = isSuccess ? 45 : 15;

        for (let i = 0; i < count; i++) {
            const pColor = isSuccess
                ? (Math.random() > 0.4 ? color : ['#f43f5e', '#10b981', '#38bdf8', '#fbbf24', '#a855f7'][Math.floor(Math.random() * 5)])
                : color;

            this.physics.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * (isSuccess ? 8 : 4),
                vy: isSuccess ? (-Math.random() * 6 - 2) : (-Math.random() * 4 - 1),
                life: 1.0,
                decay: isSuccess ? (0.015 + Math.random() * 0.025) : (0.03 + Math.random() * 0.03),
                color: pColor,
                size: isSuccess ? (3 + Math.random() * 5) : (2 + Math.random() * 4)
            });
        }
    },

    createExplosion(x, y) {
        for (let i = 0; i < 40; i++) {
            this.physics.particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 1.0,
                maxLife: 0.5 + Math.random(),
                color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b',
                size: 2 + Math.random() * 8
            });
        }
    },

});
