/**
 * render/weather.js — atmosphere presets.
 *
 * Purely cosmetic: weather never changes what is legal. Missions name a preset
 * so the campaign has a sense of place; sandbox lets the player pick.
 *
 * A preset is data. It carries the lights, the fog, the precipitation and the
 * recipe for its own sky, and `set()` does nothing but apply them — so adding
 * an atmosphere is an entry in this table, not code. `render/textures.js` does
 * the painting; it is handed the `sky` block and has no idea what a preset is.
 */
(function (window) {
    'use strict';

    const Cargo3D = window.Cargo3D = window.Cargo3D || {};

    /**
     * The eight atmospheres.
     *
     * `sun.at` is shared between the directional light and the painted sun, so
     * the glare in the sky is always on the side the shadows fall away from.
     *
     * `ambient` and `hemi` are low on purpose. The painted sky is an
     * environment map and that is where most of the fill now comes from; the
     * values that looked right when it was the only ambient light there was
     * bleach the yard white on top of one.
     * Every `sky.stops` list carries a stop just below the horizon in the fog
     * colour — see `paintSky()` for why that seam has to be painted by hand.
     */
    // A silhouette is not a cut-out: each `skyline` tint sits between the port's
    // own tone and that preset's horizon, which is what atmospheric haze does to
    // anything 300 m away.
    const PRESETS = {
        dawn: {
            label: '🌄 Dawn Shift',
            background: 0xd8996b,
            fog: { color: 0xd8996b, density: 0.0105 },
            sun: { at: [-30, 9, 24], color: 0xffb888, intensity: 1.25 },
            ambient: { color: 0xd8b0c8, intensity: 0.20 },
            hemi: { sky: 0xf0a0a0, ground: 0x2b2340, intensity: 0.16 },
            floods: 1.2,
            groundRoughness: 0.78,
            skyline: 0x7d5a67,
            sky: {
                key: 'dawn', seed: 1101,
                stops: [[0, '#101a44'], [0.22, '#33305f'], [0.38, '#8a5570'],
                        [0.455, '#c9705f'], [0.492, '#f0b483'],
                        [0.502, '#d8996b'], [0.60, '#8a6a63'], [1, '#2a1f2e']],
                sun: { at: [-30, 9, 24], glow: 0.30, disc: 0.020, core: '255,236,200', halo: '255,168,110', a: 0.92 },
                clouds: { count: 34, color: '255,190,170', a: 0.26 },
                stars: 70,
                haze: '216,153,107'
            }
        },

        day: {
            label: '☀️ Sunny Day',
            background: 0x8fb1c9,
            fog: { color: 0x8fb1c9, density: 0.0075 },
            sun: { at: [24, 34, 18], color: 0xfffbeb, intensity: 1.40 },
            ambient: { color: 0xffffff, intensity: 0.22 },
            hemi: { sky: 0x38bdf8, ground: 0x0f172a, intensity: 0.16 },
            floods: 0,
            groundRoughness: 0.80,
            skyline: 0x52738f,
            sky: {
                key: 'day', seed: 1102,
                stops: [[0, '#123063'], [0.24, '#2a5f95'], [0.42, '#6598c0'],
                        [0.492, '#8fb1c9'],
                        [0.502, '#8fb1c9'], [0.60, '#5c7286'], [1, '#1b2734']],
                sun: { at: [24, 34, 18], glow: 0.26, disc: 0.016, core: '255,252,236', halo: '255,246,214', a: 0.90 },
                clouds: { count: 42, color: '236,244,252', a: 0.30 },
                stars: 0,
                haze: '143,177,201'
            }
        },

        clear: {
            label: '🌤️ Clear Skies',
            background: 0xa9cade,
            fog: { color: 0xa9cade, density: 0.0045 },
            sun: { at: [30, 40, -14], color: 0xfffdf4, intensity: 1.55 },
            ambient: { color: 0xf0f6ff, intensity: 0.20 },
            hemi: { sky: 0x7dd3fc, ground: 0x1e293b, intensity: 0.16 },
            floods: 0,
            groundRoughness: 0.82,
            skyline: 0x5b83a4,
            sky: {
                key: 'clear', seed: 1103,
                stops: [[0, '#0d3a80'], [0.24, '#2b6db4'], [0.42, '#7cb2d8'],
                        [0.492, '#a9cade'],
                        [0.502, '#a9cade'], [0.60, '#6d8ba0'], [1, '#22364a']],
                sun: { at: [30, 40, -14], glow: 0.22, disc: 0.015, core: '255,255,248', halo: '255,250,226', a: 0.95 },
                clouds: { count: 16, color: '255,255,255', a: 0.24 },
                stars: 0,
                haze: '169,202,222'
            }
        },

        dusk: {
            label: '🌅 Sunset Dusk',
            background: 0xc9703f,
            fog: { color: 0xc9703f, density: 0.0095 },
            sun: { at: [-34, 12, -22], color: 0xf97316, intensity: 1.35 },
            ambient: { color: 0xc084fc, intensity: 0.22 },
            hemi: { sky: 0xf59e0b, ground: 0x1e1b4b, intensity: 0.16 },
            floods: 1.6,
            groundRoughness: 0.78,
            skyline: 0x6b4257,
            sky: {
                key: 'dusk', seed: 1104,
                stops: [[0, '#151046'], [0.22, '#3c2465'], [0.38, '#8b3a64'],
                        [0.452, '#b8443f'], [0.492, '#ee9448'],
                        [0.502, '#c9703f'], [0.60, '#7c4a48'], [1, '#231433']],
                sun: { at: [-34, 12, -22], glow: 0.32, disc: 0.024, core: '255,232,180', halo: '255,140,60', a: 0.95 },
                clouds: { count: 38, color: '255,170,130', a: 0.30 },
                stars: 40,
                haze: '201,112,63'
            }
        },

        rain: {
            label: '🌧️ Stormy Rain',
            background: 0x5d6b78,
            fog: { color: 0x5d6b78, density: 0.0145 },
            sun: { at: [-14, 26, -12], color: 0x94a3b8, intensity: 0.65 },
            ambient: { color: 0x64748b, intensity: 0.26 },
            hemi: { sky: 0x94a3b8, ground: 0x1e293b, intensity: 0.18 },
            floods: 2.2,
            groundRoughness: 0.20,
            skyline: 0x3c4652,
            precip: { kind: 'rain', color: 0x9ec9fb, size: 0.16, opacity: 0.55, speed: 24, spread: 24, drift: 0 },
            sky: {
                key: 'rain', seed: 1105,
                stops: [[0, '#1b232e'], [0.26, '#2c3947'], [0.43, '#46545f'],
                        [0.492, '#5d6b78'],
                        [0.502, '#5d6b78'], [0.60, '#3e4954'], [1, '#191f27']],
                sun: null,
                clouds: { count: 54, color: '138,154,170', a: 0.22 },
                stars: 0,
                haze: '93,107,120'
            }
        },

        snow: {
            label: '🌨️ Snowfall',
            background: 0x93a0ac,
            fog: { color: 0x93a0ac, density: 0.0125 },
            sun: { at: [10, 30, -20], color: 0xdfe9f5, intensity: 0.80 },
            ambient: { color: 0xc8d6e4, intensity: 0.28 },
            hemi: { sky: 0xe2ecf6, ground: 0x475569, intensity: 0.20 },
            floods: 1.4,
            groundRoughness: 0.55,
            skyline: 0x66717e,
            precip: { kind: 'snow', color: 0xf1f7ff, size: 0.22, opacity: 0.9, speed: 3.4, spread: 2.6, drift: 1.6 },
            sky: {
                key: 'snow', seed: 1106,
                stops: [[0, '#41505f'], [0.26, '#5c6a78'], [0.43, '#7d8b98'],
                        [0.492, '#93a0ac'],
                        [0.502, '#93a0ac'], [0.60, '#6c7885'], [1, '#3a434e']],
                sun: { at: [10, 30, -20], glow: 0.34, disc: 0, core: '244,249,255', halo: '226,238,250', a: 0.34 },
                clouds: { count: 62, color: '226,236,246', a: 0.24 },
                stars: 0,
                haze: '147,160,172'
            }
        },

        fog: {
            label: '🌫️ Port Fog',
            background: 0x8e99a4,
            fog: { color: 0x8e99a4, density: 0.026 },
            sun: { at: [0, 30, 4], color: 0xfef08a, intensity: 0.85 },
            ambient: { color: 0x94a3b8, intensity: 0.28 },
            hemi: { sky: 0xcbd5e1, ground: 0x334155, intensity: 0.20 },
            floods: 1.8,
            groundRoughness: 0.45,
            skyline: 0x79838e,
            sky: {
                key: 'fog', seed: 1107,
                stops: [[0, '#4a5764'], [0.28, '#616d79'], [0.44, '#7d8894'],
                        [0.492, '#8e99a4'],
                        [0.502, '#8e99a4'], [0.60, '#79838e'], [1, '#4e5862']],
                sun: { at: [0, 30, 4], glow: 0.40, disc: 0, core: '254,248,196', halo: '236,232,196', a: 0.30 },
                clouds: { count: 70, color: '206,214,222', a: 0.20 },
                stars: 0,
                haze: '142,153,164'
            }
        },

        night: {
            label: '🌙 Cyber Night',
            background: 0x14293e,
            fog: { color: 0x14293e, density: 0.0115 },
            sun: { at: [12, 28, 12], color: 0x38bdf8, intensity: 0.30 },
            ambient: { color: 0x1e1b4b, intensity: 0.26 },
            hemi: { sky: 0x38bdf8, ground: 0x050b14, intensity: 0.16 },
            floods: 5.0,
            groundRoughness: 0.60,
            skyline: 0x0a1a2c,
            sky: {
                key: 'night', seed: 1108,
                stops: [[0, '#01030a'], [0.26, '#040c19'], [0.43, '#0c1e30'],
                        [0.492, '#14293e'],
                        [0.502, '#14293e'], [0.60, '#0c1929'], [1, '#02040a']],
                // The moon: a disc with barely any halo, unlike a sun.
                sun: { at: [-20, 30, -26], glow: 0.10, disc: 0.014, core: '226,238,255', halo: '160,190,230', a: 0.40 },
                clouds: { count: 14, color: '30,52,80', a: 0.22 },
                stars: 420,
                haze: '20,41,62'
            }
        }
    };

    const PRECIP_COUNT = 2200;

    function Weather(sceneView) {
        this.sceneView = sceneView;
        this.floodlights = [];
        this.current = 'day';
        this.drift = 0;
        this.buildPrecipitation();
        this.buildFloodlights();
    }

    /**
     * One particle system for every kind of falling weather.
     *
     * Rain and snow differ only in how fast they fall, how big they are and
     * whether they wander on the way down, so they share a buffer and `set()`
     * re-points the material at whichever the preset asked for.
     */
    Weather.prototype.buildPrecipitation = function () {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(PRECIP_COUNT * 3);
        const velocities = new Float32Array(PRECIP_COUNT);
        const phases = new Float32Array(PRECIP_COUNT);

        for (let i = 0; i < PRECIP_COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 110;
            positions[i * 3 + 1] = Math.random() * 45;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 110;
            velocities[i] = Math.random();
            phases[i] = Math.random() * Math.PI * 2;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.precipGeo = geo;
        this.precipRand = velocities;
        this.precipPhase = phases;
        this.precipSpec = null;

        this.precip = new THREE.Points(geo, new THREE.PointsMaterial({
            color: 0x93c5fd, size: 0.18, transparent: true, opacity: 0.6,
            depthWrite: false, sizeAttenuation: true,
            map: Cargo3D.Textures ? Cargo3D.Textures.particleSprite() : null
        }));
        this.precip.visible = false;
        this.precip.frustumCulled = false;
        this.sceneView.add(this.precip);
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
        if (!this.precip.visible || !this.precipSpec) return;

        const spec = this.precipSpec;
        const positions = this.precipGeo.attributes.position.array;
        const rand = this.precipRand;
        const phase = this.precipPhase;
        const step = Math.min(delta, 0.05);
        this.drift += step;

        for (let i = 0; i < rand.length; i++) {
            const j = i * 3;
            positions[j + 1] -= (spec.speed + rand[i] * spec.spread) * step;

            // Snow wanders on the way down; rain does not have the time.
            if (spec.drift) {
                positions[j] += Math.sin(this.drift * 0.7 + phase[i]) * spec.drift * step;
                positions[j + 2] += Math.cos(this.drift * 0.5 + phase[i]) * spec.drift * step;
            }

            if (positions[j + 1] < 0) {
                positions[j] = (Math.random() - 0.5) * 110;
                positions[j + 1] = 38 + Math.random() * 8;
                positions[j + 2] = (Math.random() - 0.5) * 110;
            }
        }
        this.precipGeo.attributes.position.needsUpdate = true;
    };

    /**
     * Apply a preset. Everything the atmosphere touches is set on every call —
     * there is no "undo the last preset" path to get wrong.
     *
     * @param {string} mode a key of PRESETS
     */
    Weather.prototype.set = function (mode) {
        const view = this.sceneView;
        const scene = view.scene;

        this.current = PRESETS[mode] ? mode : 'day';
        const p = PRESETS[this.current];

        scene.background.setHex(p.background);
        scene.fog.color.setHex(p.fog.color);
        scene.fog.density = p.fog.density;

        view.sunLight.position.set(p.sun.at[0], p.sun.at[1], p.sun.at[2]);
        view.sunLight.color.setHex(p.sun.color);
        view.sunLight.intensity = p.sun.intensity;

        view.ambientLight.color.setHex(p.ambient.color);
        view.ambientLight.intensity = p.ambient.intensity;

        view.hemisphereLight.color.setHex(p.hemi.sky);
        view.hemisphereLight.groundColor.setHex(p.hemi.ground);
        view.hemisphereLight.intensity = p.hemi.intensity;

        this.floodlights.forEach(function (spot) { spot.intensity = p.floods; });
        if (view.groundMat) view.groundMat.roughness = p.groundRoughness;
        if (view.grid) view.grid.visible = this.current !== 'fog';

        /* The sky the metals reflect is part of the preset, not scenery behind
           it. Nothing in this three.js scales `scene.environment` globally, so
           leaving one daylight sky in place lit the night yard like noon. */
        if (Cargo3D.Textures) {
            scene.environment = Cargo3D.Textures.environment(view.renderer, p.sky);
            view.setSky(Cargo3D.Textures.sky(p.sky));
        }
        view.setSkylineTint(p.skyline);

        this.precipSpec = p.precip || null;
        this.precip.visible = !!p.precip;
        if (p.precip) {
            this.precip.material.color.setHex(p.precip.color);
            this.precip.material.size = p.precip.size;
            this.precip.material.opacity = p.precip.opacity;
        }
    };

    /* The vocabulary is core's — see `Constants.WEATHER_KEYS` — so a mission can
       be validated without loading any of this. Keeping the two in step is this
       file's job, and drifting apart is worth saying out loud. */
    if (Cargo3D.Constants) {
        const missing = Cargo3D.Constants.WEATHER_KEYS.filter(function (k) { return !PRESETS[k]; });
        const extra = Object.keys(PRESETS).filter(function (k) {
            return Cargo3D.Constants.WEATHER_KEYS.indexOf(k) === -1;
        });
        if (missing.length || extra.length) {
            console.warn('weather presets out of step with Constants.WEATHER_KEYS',
                { missing: missing, unlisted: extra });
        }
    }

    Cargo3D.Weather = Weather;
    Cargo3D.WEATHER_PRESETS = PRESETS;
})(window);
