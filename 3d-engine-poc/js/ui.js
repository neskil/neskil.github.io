(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    function setupUI(sceneControls, setWeatherPreset, terminal, gameManager) {
        const countEl = document.getElementById('metric-count');
        const teuEl = document.getElementById('metric-teu');
        const volEl = document.getElementById('metric-vol');
        const massEl = document.getElementById('metric-mass');
        const stabilityEl = document.getElementById('metric-stability');

        if (gameManager) {
            const moneyEl = document.getElementById('game-money');
            const ratingEl = document.getElementById('game-rating');
            const titleEl = document.getElementById('contract-title');
            const descEl = document.getElementById('contract-desc');
            const payoutEl = document.getElementById('contract-payout');
            const timerEl = document.getElementById('contract-timer');

            gameManager.onStatsUpdated = function(stats) {
                if (moneyEl) moneyEl.textContent = '$' + stats.money.toLocaleString();
                if (ratingEl) {
                    const grade = stats.rating >= 90 ? 'A+' : (stats.rating >= 75 ? 'B' : 'C');
                    ratingEl.textContent = grade + ' (' + stats.rating + '%)';
                }
                if (stats.contract) {
                    if (titleEl) titleEl.textContent = stats.contract.title;
                    if (descEl) descEl.textContent = stats.contract.desc;
                    if (payoutEl) payoutEl.textContent = 'Reward: $' + stats.contract.payout.toLocaleString();
                    if (timerEl) timerEl.textContent = '⏳ ' + Math.ceil(stats.contract.timeRemaining) + 's';
                }
            };
            gameManager.notifyStats();
        }

        const inspectorPanel = document.getElementById('inspector-panel');
        const inspCarrier = document.getElementById('insp-carrier');
        const inspType = document.getElementById('insp-type');
        const inspDim = document.getElementById('insp-dim');
        const inspPos = document.getElementById('insp-pos');
        const inspStack = document.getElementById('insp-stack');

        const updateHUD = function(placedObjects) {
            const metrics = window.Cargo3D.Containers.calculateYardMetrics(placedObjects);
            countEl.textContent = metrics.count;
            teuEl.textContent = metrics.teu + ' TEU';
            volEl.textContent = metrics.vol + ' m³';
            massEl.textContent = metrics.mass + ' t';
            stabilityEl.textContent = metrics.stability;
        };

        const showInspector = function(group) {
            const data = group.userData;
            const spec = data.spec;

            inspCarrier.textContent = data.carrierName || 'Standard Cargo';
            inspType.textContent = data.type === 'pallet' ? 'Wooden Euro-Pallet' : (data.type + ' Intermodal');
            inspDim.textContent = spec.length + ' × ' + spec.width + ' × ' + spec.height + ' m';
            
            const pos = group.position;
            inspPos.textContent = 'X:' + pos.x.toFixed(1) + ' Y:' + pos.y.toFixed(1) + ' Z:' + pos.z.toFixed(1);
            
            const tier = Math.max(1, Math.round(pos.y / (spec.height || 2.5)));
            inspStack.textContent = 'Tier ' + tier;

            inspectorPanel.classList.remove('hidden');
        };

        const hideInspector = function() {
            inspectorPanel.classList.add('hidden');
        };

        sceneControls.updateHUDCallback = updateHUD;
        sceneControls.showInspectorCallback = showInspector;
        sceneControls.hideInspectorCallback = hideInspector;

        // Palette Selector
        const paletteBtns = document.querySelectorAll('.palette-btn');
        paletteBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                paletteBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');

                const type = btn.getAttribute('data-type');
                const carrier = btn.getAttribute('data-carrier');
                sceneControls.setSpawnConfig(type, carrier);
            });
        });

        // Camera View Mode Buttons
        const camOrbitBtn = document.getElementById('cam-orbit');
        const camIsoBtn = document.getElementById('cam-iso');
        const camPortCraneBtn = document.getElementById('cam-port-crane');
        const camVehicleBtn = document.getElementById('cam-vehicle');
        const camBtns = [camOrbitBtn, camIsoBtn, camPortCraneBtn, camVehicleBtn];

        if (camOrbitBtn) camOrbitBtn.addEventListener('click', function() {
            camBtns.forEach(function(b) { if(b) b.classList.remove('active'); });
            camOrbitBtn.classList.add('active');
            sceneControls.setCameraMode('orbit');
        });

        if (camIsoBtn) camIsoBtn.addEventListener('click', function() {
            camBtns.forEach(function(b) { if(b) b.classList.remove('active'); });
            camIsoBtn.classList.add('active');
            sceneControls.setCameraMode('iso');
        });

        if (camPortCraneBtn) camPortCraneBtn.addEventListener('click', function() {
            camBtns.forEach(function(b) { if(b) b.classList.remove('active'); });
            camPortCraneBtn.classList.add('active');
            sceneControls.setCameraMode('port_crane');
        });

        if (camVehicleBtn) camVehicleBtn.addEventListener('click', function() {
            camBtns.forEach(function(b) { if(b) b.classList.remove('active'); });
            camVehicleBtn.classList.add('active');
            sceneControls.setCameraMode('vehicle');
        });

        // Weather Selector Dropdown
        const weatherSelect = document.getElementById('weather-select');
        if (weatherSelect) {
            weatherSelect.addEventListener('change', function(e) {
                setWeatherPreset(e.target.value);
            });
        }

        // X-Ray View Toggle
        const xrayBtn = document.getElementById('btn-toggle-xray');
        if (xrayBtn) {
            xrayBtn.addEventListener('click', function() {
                const active = window.Cargo3D.Containers.toggleXRayMode(sceneControls.placedObjects);
                xrayBtn.classList.toggle('active', active);
            });
        }

        // Stress Heatmap Toggle
        const heatmapBtn = document.getElementById('btn-toggle-heatmap');
        if (heatmapBtn) {
            heatmapBtn.addEventListener('click', function() {
                const active = window.Cargo3D.Containers.toggleStressHeatmap(sceneControls.placedObjects);
                heatmapBtn.classList.toggle('active', active);
            });
        }

        // Audio Mute Toggle
        const audioBtn = document.getElementById('btn-audio-toggle');
        if (audioBtn) {
            audioBtn.addEventListener('click', function() {
                const muted = window.Cargo3D.Audio.toggleMute();
                audioBtn.innerHTML = muted ? '🔇 Muted' : '🔊 Audio ON';
            });
        }

        // Auto Train Unloader Script Button
        const trainBtn = document.getElementById('btn-unload-train');
        if (trainBtn) {
            trainBtn.addEventListener('click', function() {
                if (terminal) {
                    terminal.autoUnloadTrain(sceneControls);
                }
            });
        }

        // Inspector Buttons
        document.getElementById('btn-close-inspector')?.addEventListener('click', function() {
            sceneControls.deselectObject();
        });

        document.getElementById('btn-rotate-unit')?.addEventListener('click', function() {
            sceneControls.rotateSelectedUnit();
        });

        document.getElementById('btn-delete-unit')?.addEventListener('click', function() {
            sceneControls.deleteSelectedUnit();
        });

        document.getElementById('btn-reset-scene')?.addEventListener('click', function() {
            sceneControls.clearYard();
        });
    }

    window.Cargo3D.setupUI = setupUI;
})(window);
