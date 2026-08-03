/**
 * render/weather.js — atmosphere presets.
 *
 * Purely cosmetic: weather never changes what is legal. Missions name a preset
 * so the campaign has a sense of place; sandbox lets the player pick.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    const PRESETS = {
        day:   { label: '☀️ Sunny Day' },
        dusk:  { label: '🌅 Sunset Dusk' },
        rain:  { label: '🌧️ Stormy Rain' },
        night: { label: '🌙 Cyber Night' },
        fog:   { label: '🌫️ Port Fog' }
    };

    function Weather(sceneView) {
        this.sceneView = sceneView;
        this.floodlights = [];
        this.current = 'day';
        this.buildRain();
        this.buildFloodlights();
    }

    Weather.prototype.buildRain = function () {
        const count = 1800;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = Math.random() * 45;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
            velocities[i] = 22 + Math.random() * 22;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.rainGeo = geo;
        this.rainVelocities = velocities;

        this.rain = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x93c5fd, size: 0.18, transparent: true, opacity: 0.6
        }));
        this.rain.visible = false;
        this.sceneView.add(this.rain);
    };

    Weather.prototype.buildFloodlights = function () {
        const self = this;
        [[-34, 20, -34], [34, 20, -34], [-34, 20, 34], [34, 20, 34]].forEach(function (at) {
            const spot = new THREE.SpotLight(0x93c5fd, 0, 90, Math.PI / 4.5, 0.45, 1);
            spot.position.set(at[0], at[1], at[2]);
            spot.target.position.set(0, 0, 0);
            self.sceneView.add(spot);
            self.sceneView.add(spot.target);
            self.floodlights.push(spot);
        });
    };

    Weather.prototype.update = function (delta) {
        if (!this.rain.visible) return;
        const positions = this.rainGeo.attributes.position.array;
        const v = this.rainVelocities;
        const step = Math.min(delta, 0.05);
        for (let i = 0; i < v.length; i++) {
            positions[i * 3 + 1] -= v[i] * step;
            if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 38 + Math.random() * 8;
        }
        this.rainGeo.attributes.position.needsUpdate = true;
    };

    Weather.prototype.set = function (mode) {
        const view = this.sceneView;
        const scene = view.scene;
        const sun = view.sunLight;
        const ambient = view.ambientLight;
        const hemi = view.hemisphereLight;

        this.current = PRESETS[mode] ? mode : 'day';
        mode = this.current;

        this.rain.visible = false;
        scene.fog.density = 0.010;
        this.floodlights.forEach(function (spot) { spot.intensity = 0; });
        if (view.groundMat) view.groundMat.roughness = 0.8;
        if (view.grid) view.grid.visible = true;

        if (mode === 'rain') {
            scene.background.setHex(0x1e293b);
            scene.fog.color.setHex(0x1e293b);
            scene.fog.density = 0.018;
            sun.position.set(-14, 26, -12);
            sun.color.setHex(0x94a3b8);
            sun.intensity = 0.65;
            ambient.color.setHex(0x475569);
            ambient.intensity = 0.45;
            hemi.intensity = 0.35;
            this.rain.visible = true;
            if (view.groundMat) view.groundMat.roughness = 0.2;
        } else if (mode === 'fog') {
            scene.background.setHex(0x334155);
            scene.fog.color.setHex(0x334155);
            scene.fog.density = 0.030;
            sun.position.set(0, 30, 4);
            sun.color.setHex(0xfef08a);
            sun.intensity = 0.85;
            ambient.color.setHex(0x64748b);
            ambient.intensity = 0.6;
            hemi.intensity = 0.5;
        } else if (mode === 'night') {
            scene.background.setHex(0x050b14);
            scene.fog.color.setHex(0x050b14);
            scene.fog.density = 0.012;
            sun.position.set(12, 28, 12);
            sun.color.setHex(0x38bdf8);
            sun.intensity = 0.3;
            ambient.color.setHex(0x1e1b4b);
            ambient.intensity = 0.32;
            hemi.intensity = 0.25;
            this.floodlights.forEach(function (spot) { spot.intensity = 5.0; });
        } else if (mode === 'dusk') {
            scene.background.setHex(0x1e1b4b);
            scene.fog.color.setHex(0x1e1b4b);
            sun.position.set(-34, 12, -22);
            sun.color.setHex(0xf97316);
            sun.intensity = 1.35;
            ambient.color.setHex(0xc084fc);
            ambient.intensity = 0.48;
            hemi.intensity = 0.4;
        } else {
            scene.background.setHex(0x0f172a);
            scene.fog.color.setHex(0x0f172a);
            sun.position.set(24, 34, 18);
            sun.color.setHex(0xfffbeb);
            sun.intensity = 1.4;
            ambient.color.setHex(0xffffff);
            ambient.intensity = 0.6;
            hemi.intensity = 0.5;
        }
    };

    Cargo3D.Weather = Weather;
    Cargo3D.WEATHER_PRESETS = PRESETS;
})(window);
