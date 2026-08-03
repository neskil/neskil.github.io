(function (window) {
    'use strict';

    // Atmosphere presets. Purely cosmetic — no preset changes a rule, so a
    // score set at night is comparable with one set at noon.
    const CY = window.CY = window.CY || {};

    let rain = null;
    let rainGeo = null;
    let floodlights = [];
    let current = 'day';

    function attach(scene) {
        const count = 1500;
        rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = Math.random() * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
            velocities[i] = 0.4 + Math.random() * 0.4;
        }
        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        rainGeo.userData = { velocities: velocities };

        rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({
            color: 0x93c5fd, size: 0.18, transparent: true, opacity: 0.6
        }));
        rain.visible = false;
        scene.add(rain);

        [[-28, 18, -28], [28, 18, -28], [-28, 18, 28], [28, 18, 28]].forEach(function (p) {
            const spot = new THREE.SpotLight(0x38bdf8, 0, 70, Math.PI / 4, 0.4, 1);
            spot.position.set(p[0], p[1], p[2]);
            spot.target.position.set(0, 0, 0);
            scene.add(spot);
            scene.add(spot.target);
            floodlights.push(spot);
        });

        CY.render.onFrame(update);
    }

    // Rain is frame-rate independent now; it used to fall a fixed number of
    // units per frame, so it sheeted down at 144 Hz and drizzled at 30.
    function update(delta) {
        if (!rain || !rain.visible) return;
        const pos = rainGeo.attributes.position.array;
        const vel = rainGeo.userData.velocities;
        const scale = delta * 60;
        for (let i = 0; i < vel.length; i++) {
            pos[i * 3 + 1] -= vel[i] * scale;
            if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 35 + Math.random() * 5;
        }
        rainGeo.attributes.position.needsUpdate = true;
    }

    function set(mode) {
        const R = CY._render;
        if (!R || !R.scene || !R.sun) return;
        current = mode;

        rain.visible = false;
        R.scene.fog.density = 0.012;
        floodlights.forEach(function (s) { s.intensity = 0; });
        if (R.groundMat) R.groundMat.roughness = 0.8;

        if (mode === 'rain') {
            R.scene.background.setHex(0x1e293b);
            R.scene.fog.color.setHex(0x1e293b);
            R.scene.fog.density = 0.022;
            R.sun.position.set(-10, 20, -10);
            R.sun.color.setHex(0x94a3b8);
            R.sun.intensity = 0.6;
            R.ambient.color.setHex(0x475569);
            R.ambient.intensity = 0.4;
            rain.visible = true;
            if (R.groundMat) R.groundMat.roughness = 0.2;
        } else if (mode === 'fog') {
            R.scene.background.setHex(0x334155);
            R.scene.fog.color.setHex(0x334155);
            R.scene.fog.density = 0.040;
            R.sun.position.set(0, 25, 0);
            R.sun.color.setHex(0xfef08a);
            R.sun.intensity = 0.8;
            R.ambient.color.setHex(0x64748b);
            R.ambient.intensity = 0.5;
        } else if (mode === 'night') {
            R.scene.background.setHex(0x050b14);
            R.scene.fog.color.setHex(0x050b14);
            R.sun.position.set(10, 25, 10);
            R.sun.color.setHex(0x38bdf8);
            R.sun.intensity = 0.3;
            R.ambient.color.setHex(0x1e1b4b);
            R.ambient.intensity = 0.25;
            floodlights.forEach(function (s) { s.intensity = 4.5; });
        } else if (mode === 'dusk') {
            R.scene.background.setHex(0x1e1b4b);
            R.scene.fog.color.setHex(0x1e1b4b);
            R.sun.position.set(-30, 10, -20);
            R.sun.color.setHex(0xf97316);
            R.sun.intensity = 1.3;
            R.ambient.color.setHex(0xc084fc);
            R.ambient.intensity = 0.45;
        } else {
            R.scene.background.setHex(0x0f172a);
            R.scene.fog.color.setHex(0x0f172a);
            R.sun.position.set(20, 30, 15);
            R.sun.color.setHex(0xfffbeb);
            R.sun.intensity = 1.4;
            R.ambient.color.setHex(0xffffff);
            R.ambient.intensity = 0.6;
        }
    }

    CY.weather = { attach: attach, set: set, current: function () { return current; } };

})(window);
