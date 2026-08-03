(function(window) {
    'use strict';

    window.Cargo3D = window.Cargo3D || {};

    let rainParticles = null;
    let rainGeo = null;
    let floodlights = [];

    function initWeather(scene) {
        // Create 3D Rain Particle System (1500 rain droplets)
        const particleCount = 1500;
        rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 80;
            positions[i * 3 + 1] = Math.random() * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
            velocities[i] = 0.4 + Math.random() * 0.4;
        }

        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        rainGeo.userData = { velocities: velocities };

        const rainMat = new THREE.PointsMaterial({
            color: 0x93c5fd,
            size: 0.18,
            transparent: true,
            opacity: 0.6
        });

        rainParticles = new THREE.Points(rainGeo, rainMat);
        rainParticles.visible = false;
        scene.add(rainParticles);

        // Add 4 Gantry Tower Spotlights for Cyber Night mode
        const towerPositions = [[-25, 18, -25], [25, 18, -25], [-25, 18, 25], [25, 18, 25]];
        towerPositions.forEach(function(pos) {
            const spot = new THREE.SpotLight(0x38bdf8, 0, 60, Math.PI / 4, 0.4, 1);
            spot.position.set(pos[0], pos[1], pos[2]);
            spot.target.position.set(0, 0, 0);
            scene.add(spot);
            scene.add(spot.target);
            floodlights.push(spot);
        });
    }

    function updateWeather(delta) {
        if (rainParticles && rainParticles.visible) {
            const positions = rainGeo.attributes.position.array;
            const vels = rainGeo.userData.velocities;
            const count = vels.length;

            for (let i = 0; i < count; i++) {
                positions[i * 3 + 1] -= vels[i];
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = 35 + Math.random() * 5;
                }
            }
            rainGeo.attributes.position.needsUpdate = true;
        }
    }

    function setWeatherPreset(scene, sunLight, ambientLight, groundMat, mode) {
        if (!scene || !sunLight || !ambientLight) return;

        // Reset default states
        rainParticles.visible = false;
        scene.fog.density = 0.012;
        floodlights.forEach(function(spot) { spot.intensity = 0; });
        if (groundMat) groundMat.roughness = 0.8;

        if (mode === 'rain') {
            // Stormy Rain
            scene.background.setHex(0x1e293b);
            scene.fog.color.setHex(0x1e293b);
            scene.fog.density = 0.022;
            sunLight.position.set(-10, 20, -10);
            sunLight.color.setHex(0x94a3b8);
            sunLight.intensity = 0.6;
            ambientLight.color.setHex(0x475569);
            ambientLight.intensity = 0.4;
            rainParticles.visible = true;
            if (groundMat) groundMat.roughness = 0.2; // Wet reflective surface!
        } else if (mode === 'fog') {
            // Coastal Port Fog
            scene.background.setHex(0x334155);
            scene.fog.color.setHex(0x334155);
            scene.fog.density = 0.045; // Thick fog
            sunLight.position.set(0, 25, 0);
            sunLight.color.setHex(0xfef08a);
            sunLight.intensity = 0.8;
            ambientLight.color.setHex(0x64748b);
            ambientLight.intensity = 0.5;
        } else if (mode === 'night') {
            // Cyber Night Floodlights
            scene.background.setHex(0x050b14);
            scene.fog.color.setHex(0x050b14);
            sunLight.position.set(10, 25, 10);
            sunLight.color.setHex(0x38bdf8);
            sunLight.intensity = 0.3;
            ambientLight.color.setHex(0x1e1b4b);
            ambientLight.intensity = 0.2;
            floodlights.forEach(function(spot) { spot.intensity = 4.5; }); // Turn on high-intensity floodlights
        } else if (mode === 'dusk') {
            // Golden Sunset
            scene.background.setHex(0x1e1b4b);
            scene.fog.color.setHex(0x1e1b4b);
            sunLight.position.set(-30, 10, -20);
            sunLight.color.setHex(0xf97316);
            sunLight.intensity = 1.3;
            ambientLight.color.setHex(0xc084fc);
            ambientLight.intensity = 0.45;
        } else {
            // Clear Sunny Day
            scene.background.setHex(0x0f172a);
            scene.fog.color.setHex(0x0f172a);
            sunLight.position.set(20, 30, 15);
            sunLight.color.setHex(0xfffbeb);
            sunLight.intensity = 1.4;
            ambientLight.color.setHex(0xffffff);
            ambientLight.intensity = 0.6;
        }
    }

    window.Cargo3D.Weather = {
        initWeather: initWeather,
        updateWeather: updateWeather,
        setWeatherPreset: setWeatherPreset
    };
})(window);
