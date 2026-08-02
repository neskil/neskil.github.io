(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    function setupUI(sceneControls, setLightingPreset) {
        const countEl = document.getElementById('metric-count');
        const teuEl = document.getElementById('metric-teu');
        const volEl = document.getElementById('metric-vol');
        const massEl = document.getElementById('metric-mass');
        const stabilityEl = document.getElementById('metric-stability');

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

        const camOrbitBtn = document.getElementById('cam-orbit');
        const camIsoBtn = document.getElementById('cam-iso');
        const camCraneBtn = document.getElementById('cam-crane');
        const camBtns = [camOrbitBtn, camIsoBtn, camCraneBtn];

        camOrbitBtn.addEventListener('click', function() {
            camBtns.forEach(function(b) { b.classList.remove('active'); });
            camOrbitBtn.classList.add('active');
            sceneControls.setCameraMode('orbit');
        });

        camIsoBtn.addEventListener('click', function() {
            camBtns.forEach(function(b) { b.classList.remove('active'); });
            camIsoBtn.classList.add('active');
            sceneControls.setCameraMode('iso');
        });

        camCraneBtn.addEventListener('click', function() {
            camBtns.forEach(function(b) { b.classList.remove('active'); });
            camCraneBtn.classList.add('active');
            sceneControls.setCameraMode('crane');
        });

        const lightDayBtn = document.getElementById('light-day');
        const lightDuskBtn = document.getElementById('light-dusk');
        const lightNightBtn = document.getElementById('light-night');
        const lightBtns = [lightDayBtn, lightDuskBtn, lightNightBtn];

        lightDayBtn.addEventListener('click', function() {
            lightBtns.forEach(function(b) { b.classList.remove('active'); });
            lightDayBtn.classList.add('active');
            setLightingPreset('day');
        });

        lightDuskBtn.addEventListener('click', function() {
            lightBtns.forEach(function(b) { b.classList.remove('active'); });
            lightDuskBtn.classList.add('active');
            setLightingPreset('dusk');
        });

        lightNightBtn.addEventListener('click', function() {
            lightBtns.forEach(function(b) { b.classList.remove('active'); });
            lightNightBtn.classList.add('active');
            setLightingPreset('night');
        });

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
