import { calculateYardMetrics } from './containers.js';

export function setupUI(sceneControls, setLightingPreset) {
    // HUD Metric Elements
    const countEl = document.getElementById('metric-count');
    const teuEl = document.getElementById('metric-teu');
    const volEl = document.getElementById('metric-vol');
    const massEl = document.getElementById('metric-mass');
    const stabilityEl = document.getElementById('metric-stability');

    // Inspector Panel Elements
    const inspectorPanel = document.getElementById('inspector-panel');
    const inspCarrier = document.getElementById('insp-carrier');
    const inspType = document.getElementById('insp-type');
    const inspDim = document.getElementById('insp-dim');
    const inspPos = document.getElementById('insp-pos');
    const inspStack = document.getElementById('insp-stack');

    // Update HUD Callback
    const updateHUD = (placedObjects) => {
        const metrics = calculateYardMetrics(placedObjects);
        countEl.textContent = metrics.count;
        teuEl.textContent = `${metrics.teu} TEU`;
        volEl.textContent = `${metrics.vol} m³`;
        massEl.textContent = `${metrics.mass} t`;
        stabilityEl.textContent = metrics.stability;
    };

    // Inspector Callbacks
    const showInspector = (group) => {
        const data = group.userData;
        const spec = data.spec;

        inspCarrier.textContent = data.carrierName || 'Standard Cargo';
        inspType.textContent = data.type === 'pallet' ? 'Wooden Euro-Pallet' : `${data.type} Intermodal`;
        inspDim.textContent = `${spec.length} × ${spec.width} × ${spec.height} m`;
        
        const pos = group.position;
        inspPos.textContent = `X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)}`;
        
        const tier = Math.max(1, Math.round(pos.y / (spec.height || 2.5)));
        inspStack.textContent = `Tier ${tier}`;

        inspectorPanel.classList.remove('hidden');
    };

    const hideInspector = () => {
        inspectorPanel.classList.add('hidden');
    };

    // Register Callbacks to Controls
    sceneControls.updateHUDCallback = updateHUD;
    sceneControls.showInspectorCallback = showInspector;
    sceneControls.hideInspectorCallback = hideInspector;

    // Palette Buttons Click Listener
    const paletteBtns = document.querySelectorAll('.palette-btn');
    paletteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            paletteBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.getAttribute('data-type');
            const carrier = btn.getAttribute('data-carrier');
            sceneControls.setSpawnConfig(type, carrier);
        });
    });

    // Camera Mode Buttons
    const camOrbitBtn = document.getElementById('cam-orbit');
    const camIsoBtn = document.getElementById('cam-iso');
    const camCraneBtn = document.getElementById('cam-crane');
    const camBtns = [camOrbitBtn, camIsoBtn, camCraneBtn];

    camOrbitBtn.addEventListener('click', () => {
        camBtns.forEach(b => b.classList.remove('active'));
        camOrbitBtn.classList.add('active');
        sceneControls.setCameraMode('orbit');
    });

    camIsoBtn.addEventListener('click', () => {
        camBtns.forEach(b => b.classList.remove('active'));
        camIsoBtn.classList.add('active');
        sceneControls.setCameraMode('iso');
    });

    camCraneBtn.addEventListener('click', () => {
        camBtns.forEach(b => b.classList.remove('active'));
        camCraneBtn.classList.add('active');
        sceneControls.setCameraMode('crane');
    });

    // Lighting Buttons
    const lightDayBtn = document.getElementById('light-day');
    const lightDuskBtn = document.getElementById('light-dusk');
    const lightNightBtn = document.getElementById('light-night');
    const lightBtns = [lightDayBtn, lightDuskBtn, lightNightBtn];

    lightDayBtn.addEventListener('click', () => {
        lightBtns.forEach(b => b.classList.remove('active'));
        lightDayBtn.classList.add('active');
        setLightingPreset('day');
    });

    lightDuskBtn.addEventListener('click', () => {
        lightBtns.forEach(b => b.classList.remove('active'));
        lightDuskBtn.classList.add('active');
        setLightingPreset('dusk');
    });

    lightNightBtn.addEventListener('click', () => {
        lightBtns.forEach(b => b.classList.remove('active'));
        lightNightBtn.classList.add('active');
        setLightingPreset('night');
    });

    // Inspector Action Buttons
    document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
        sceneControls.deselectObject();
    });

    document.getElementById('btn-rotate-unit')?.addEventListener('click', () => {
        sceneControls.rotateSelectedUnit();
    });

    document.getElementById('btn-delete-unit')?.addEventListener('click', () => {
        sceneControls.deleteSelectedUnit();
    });

    document.getElementById('btn-reset-scene')?.addEventListener('click', () => {
        sceneControls.clearYard();
    });
}
