(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    const CONTRACT_TEMPLATES = [
        {
            title: 'Unload Train Cargo to Transfer Bay',
            desc: 'Operate Port Crane to lift 40ft container from freight train flatcar onto Yard Bay Alpha (X: -25 to -15).',
            type: 'unload_train',
            payout: 4800,
            targetXMin: -28,
            targetXMax: -14,
            targetZMin: -20,
            targetZMax: 20
        },
        {
            title: 'Stack Export Cargo in Central Depot',
            desc: 'Drive Reach Stacker or Crane to place Maersk or Hapag unit in the Central Depot Zone (X: -5 to 5).',
            type: 'yard_stack',
            payout: 3500,
            targetXMin: -8,
            targetXMax: 8,
            targetZMin: -10,
            targetZMax: 10
        },
        {
            title: 'Express Freight Delivery to East Platform',
            desc: 'Transport any intermodal container across to the Eastern Semi-Truck Delivery Deck (X: 15 to 30).',
            type: 'express_delivery',
            payout: 6200,
            targetXMin: 15,
            targetXMax: 32,
            targetZMin: -10,
            targetZMax: 10
        }
    ];

    function GameManager(sceneControls, terminal) {
        this.sceneControls = sceneControls;
        this.terminal = terminal;
        
        // Player Financials & Stats
        this.money = 15000;
        this.deliveredCount = 0;
        this.rating = 100;
        this.activeContract = null;
        this.timer = 120; // Seconds remaining for contract
        
        // Upgrades Owned
        this.upgrades = {
            fastWinch: false,
            extendedSnap: false,
            autoDispatch: false
        };

        this.onStatsUpdated = function() {};
        this.onContractSuccess = function(msg, payout) {};
        
        this.generateNextContract();
    }

    GameManager.prototype.generateNextContract = function() {
        const idx = Math.floor(Math.random() * CONTRACT_TEMPLATES.length);
        const template = CONTRACT_TEMPLATES[idx];
        
        this.activeContract = {
            id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
            title: template.title,
            desc: template.desc,
            type: template.type,
            payout: template.payout,
            targetXMin: template.targetXMin,
            targetXMax: template.targetXMax,
            targetZMin: template.targetZMin,
            targetZMax: template.targetZMax,
            timeRemaining: 150
        };
        
        this.notifyStats();
    };

    GameManager.prototype.update = function(delta, placedObjects) {
        if (!this.activeContract) return;

        // Count down contract deadline
        this.activeContract.timeRemaining = Math.max(0, this.activeContract.timeRemaining - delta);
        if (this.activeContract.timeRemaining === 0) {
            // Expired contract penalty
            this.money = Math.max(0, this.money - 1500);
            this.rating = Math.max(50, this.rating - 5);
            this.generateNextContract();
            if (this.onContractSuccess) this.onContractSuccess('Contract Expired! $1,500 penalty fee deducted.', -1500);
            return;
        }

        // Check if any container in placedObjects fulfills target delivery coordinates
        for (let i = 0; i < placedObjects.length; i++) {
            const obj = placedObjects[i];
            const p = obj.position;
            
            // Avoid counting items currently being carried by crane or stacker
            if (this.sceneControls && (this.sceneControls.crane && this.sceneControls.crane.carriedContainer === obj)) continue;
            if (this.sceneControls && (this.sceneControls.vehicle && this.sceneControls.vehicle.carriedContainer === obj)) continue;
            
            // Check boundary matching
            if (p.x >= this.activeContract.targetXMin && p.x <= this.activeContract.targetXMax &&
                p.z >= this.activeContract.targetZMin && p.z <= this.activeContract.targetZMax) {
                
                // Has this specific item already triggered an award?
                if (!obj.userData.contractCompleted) {
                    obj.userData.contractCompleted = true;
                    this.completeActiveContract(obj);
                    break;
                }
            }
        }
    };

    GameManager.prototype.completeActiveContract = function(obj) {
        const reward = this.activeContract.payout;
        this.money += reward;
        this.deliveredCount++;
        this.rating = Math.min(100, this.rating + 2);

        if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();
        if (this.onContractSuccess) {
            this.onContractSuccess(`Contract ${this.activeContract.id} Complete! Earned +$${reward.toLocaleString()}.`, reward);
        }
        
        this.generateNextContract();
    };

    GameManager.prototype.buyUpgrade = function(upgradeKey, cost) {
        if (this.money < cost || this.upgrades[upgradeKey]) return false;
        
        this.money -= cost;
        this.upgrades[upgradeKey] = true;

        if (upgradeKey === 'fastWinch' && this.sceneControls && this.sceneControls.crane) {
            this.sceneControls.crane.maxSpeed *= 1.6;
        }

        this.notifyStats();
        if (window.Cargo3D.Audio) window.Cargo3D.Audio.playLockSound();
        return true;
    };

    GameManager.prototype.notifyStats = function() {
        if (this.onStatsUpdated) {
            this.onStatsUpdated({
                money: this.money,
                delivered: this.deliveredCount,
                rating: this.rating,
                contract: this.activeContract
            });
        }
    };

    window.Cargo3D.GameManager = GameManager;
})(window);
