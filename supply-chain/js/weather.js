// Weather simulation & gameplay effects. Pure logic — no DOM, no canvas.
//
// Owns the live weather state on SC.state.weather so both road speeds /
// Dijkstra routing (roads.js), audio ambience (audio.js), visual precip /
// lightning (render-env.js) and the HUD forecast pill (ui.js) all read one
// authoritative source. Rain and snow slow unpaved roads and river ferries
// meaningfully while paved highways resist bad weather, giving Asphalt Paving
// a real all-weather strategic payoff.
window.SC = window.SC || {};

SC.weather = (function() {
    function rotation() {
        return (SC.CONFIG && SC.CONFIG.WEATHER_ROTATION) || ['clear', 'clouds', 'rain', 'clouds', 'clear', 'snow', 'clouds'];
    }

    function metaFor(type) {
        const table = SC.CONFIG && SC.CONFIG.WEATHER_META;
        return (table && table[type]) || { emoji: '☀️', label: 'Clear' };
    }

    function freshState() {
        const rot = rotation();
        return {
            i: 0,
            type: rot[0],
            t: 0,
            dur: (SC.CONFIG && SC.CONFIG.WEATHER_FIRST_DURATION) || 40,
            intensity: 0,
            cloud: 0,
            snow: 0,
            windAng: 0.6,
            windMag: 0.5,
            forced: null
        };
    }

    function current() {
        if (!SC.state) return freshState();
        if (!SC.state.weather) SC.state.weather = freshState();
        return SC.state.weather;
    }

    function weatherMult() {
        if (!SC.diff) return 1;
        const d = SC.diff();
        return d && d.weatherMult !== undefined ? d.weatherMult : 1;
    }

    function setForced(type) {
        const w = current();
        if (!type) {
            w.forced = null;
            return;
        }
        const rot = rotation();
        w.forced = type;
        w.type = type;
        w.intensity = 1;
        const idx = rot.indexOf(type);
        if (idx !== -1) w.i = idx;
        if (type === 'clouds' || type === 'rain' || type === 'snow') {
            w.cloud = Math.max(w.cloud, 0.9);
        } else {
            w.cloud = 0;
        }
        if (type === 'snow') w.snow = Math.max(w.snow, 0.75);
        else if (type === 'clear') w.snow = 0;
    }

    function tick(dt) {
        const w = current();
        const rot = rotation();
        const durRange = (SC.CONFIG && SC.CONFIG.WEATHER_DURATION) || [42, 70];

        if (w.forced) {
            if (w.type !== w.forced) {
                w.type = w.forced;
                SC.emit('weatherChanged', { type: w.type, prev: null });
            }
            w.intensity = 1;
        } else {
            w.t += dt;
            const u = w.dur > 0 ? w.t / w.dur : 1;
            // Smooth 0→1→0 ramp over the first/last 18% of each spell so
            // particles and road drag ease in and out before switching.
            w.intensity = Math.max(0, Math.min(1, Math.min(u / 0.18, (1 - u) / 0.18)));
            if (w.t >= w.dur) {
                const prev = w.type;
                w.i = (w.i + 1) % rot.length;
                w.type = rot[w.i];
                w.t = 0;
                w.dur = durRange[0] + Math.random() * (durRange[1] - durRange[0]);
                w.intensity = 0;
                SC.emit('weatherChanged', { type: w.type, prev });
            }
        }

        const overcast = (w.type === 'clouds' || w.type === 'rain' || w.type === 'snow')
            ? w.intensity : 0;
        w.cloud += (overcast - w.cloud) * Math.min(1, dt * 0.6);

        // Snow accumulates while falling and melts slowly afterwards.
        const snowing = w.type === 'snow' ? w.intensity : 0;
        w.snow += (snowing - w.snow) * Math.min(1, dt * (snowing > w.snow ? 0.4 : 0.06));

        w.windAng += dt * 0.06;
        w.windMag = 0.35 + 0.25 * Math.sin((SC.state ? SC.state.time : 0) * 0.05);
    }

    // Road speed multiplier for a single edge (or synthetic surface descriptor
    // `{ level, ferry }`) under the live weather and active difficulty.
    function roadSpeedMult(edge) {
        const w = current();
        const penTable = SC.CONFIG && SC.CONFIG.WEATHER_PENALTY;
        const pen = penTable && penTable[w.type];
        if (!pen || w.intensity <= 0.02) return 1;
        const dm = weatherMult();
        if (dm <= 0) return 1;

        const surfacePen = (edge && edge.ferry)
            ? pen.ferry
            : ((edge && edge.level > 0) ? pen.highway : pen.unpaved);
        const floor = (SC.CONFIG && SC.CONFIG.WEATHER_SPEED_FLOOR) || 0.45;
        return Math.max(floor, 1 - surfacePen * w.intensity * dm);
    }

    // Coarse bucket for Dijkstra's path cache key: steady ('0') in clear/clouds
    // or Sandbox, and at most 5 steps during storm ramp-in/out so the cache
    // adapts to weather without thrashing every frame.
    function cacheBucket() {
        const w = current();
        const penTable = SC.CONFIG && SC.CONFIG.WEATHER_PENALTY;
        if (!penTable || !penTable[w.type] || w.intensity <= 0.02) return '0';
        const dm = weatherMult();
        if (dm <= 0) return '0';
        return w.type + Math.round(w.intensity * dm * 5);
    }

    // Current conditions + upcoming spell + live speed multipliers per surface,
    // read by the HUD weather pill and forecast popover.
    function forecast() {
        const w = current();
        const rot = rotation();
        const nextType = rot[(w.i + 1) % rot.length];
        const curMeta = metaFor(w.type);
        const nextMeta = metaFor(nextType);
        const unpaved = roadSpeedMult({ level: 0, ferry: false });
        const highway = roadSpeedMult({ level: 1, ferry: false });
        const ferry = roadSpeedMult({ level: 0, ferry: true });
        return {
            current: {
                type: w.type,
                emoji: curMeta.emoji,
                label: curMeta.label,
                intensity: w.intensity,
                isAdverse: unpaved < 0.995
            },
            next: {
                type: nextType,
                emoji: nextMeta.emoji,
                label: nextMeta.label
            },
            timeLeft: w.forced ? null : Math.max(0, w.dur - w.t),
            forced: !!w.forced,
            mults: { unpaved, highway, ferry }
        };
    }

    return { freshState, current, tick, setForced, roadSpeedMult, cacheBucket, forecast, metaFor };
})();
