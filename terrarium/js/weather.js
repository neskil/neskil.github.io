// Pocket Weather Terrarium — everything that is not drawing: where the jar is,
// what the sky there is doing, and where the sun is. No DOM, so tests.html can
// hold it to account.

/* ── Weather codes ───────────────────────────────────────────────────────
   Open-Meteo reports WMO weather interpretation codes. The jar does not need
   twenty-eight kinds of weather; it needs to know how cloudy, how wet, how
   snowy, how foggy and whether to throw lightning. Each code maps onto those
   five dials, and the label is what the little card under the jar says. */
const CODES = {
    0: ['Clear sky', { cloud: 0 }],
    1: ['Mainly clear', { cloud: 0.2 }],
    2: ['Partly cloudy', { cloud: 0.5 }],
    3: ['Overcast', { cloud: 0.95 }],
    45: ['Fog', { cloud: 0.6, fog: 0.85 }],
    48: ['Freezing fog', { cloud: 0.6, fog: 0.9 }],
    51: ['Light drizzle', { cloud: 0.8, rain: 0.15 }],
    53: ['Drizzle', { cloud: 0.85, rain: 0.25 }],
    55: ['Heavy drizzle', { cloud: 0.9, rain: 0.35 }],
    56: ['Freezing drizzle', { cloud: 0.85, rain: 0.25 }],
    57: ['Freezing drizzle', { cloud: 0.9, rain: 0.35 }],
    61: ['Light rain', { cloud: 0.85, rain: 0.35 }],
    63: ['Rain', { cloud: 0.9, rain: 0.6 }],
    65: ['Heavy rain', { cloud: 1, rain: 0.95 }],
    66: ['Freezing rain', { cloud: 0.9, rain: 0.5 }],
    67: ['Freezing rain', { cloud: 1, rain: 0.8 }],
    71: ['Light snow', { cloud: 0.85, snow: 0.3 }],
    73: ['Snow', { cloud: 0.9, snow: 0.6 }],
    75: ['Heavy snow', { cloud: 1, snow: 0.95 }],
    77: ['Snow grains', { cloud: 0.85, snow: 0.3 }],
    80: ['Rain showers', { cloud: 0.7, rain: 0.45 }],
    81: ['Rain showers', { cloud: 0.8, rain: 0.65 }],
    82: ['Violent showers', { cloud: 1, rain: 1 }],
    85: ['Snow showers', { cloud: 0.75, snow: 0.45 }],
    86: ['Heavy snow showers', { cloud: 0.95, snow: 0.85 }],
    95: ['Thunderstorm', { cloud: 1, rain: 0.8, storm: true }],
    96: ['Thunderstorm, hail', { cloud: 1, rain: 0.85, storm: true }],
    99: ['Thunderstorm, hail', { cloud: 1, rain: 1, storm: true }],
};

export function describe(code) {
    const hit = CODES[code];
    const [label, dials] = hit || ['Unsettled', { cloud: 0.6 }];
    return { label, cloud: 0, rain: 0, snow: 0, fog: 0, storm: false, ...dials };
}

/* The weather you can pick by hand, as WMO codes, so a picked sky and a
   reported one go through exactly the same path. */
export const PRESETS = [
    { id: 'clear', emoji: '☀️', label: 'Clear', code: 0 },
    { id: 'cloudy', emoji: '☁️', label: 'Cloudy', code: 3 },
    { id: 'rain', emoji: '🌧️', label: 'Rain', code: 63 },
    { id: 'storm', emoji: '⛈️', label: 'Storm', code: 95 },
    { id: 'snow', emoji: '❄️', label: 'Snow', code: 73 },
    { id: 'fog', emoji: '🌫️', label: 'Fog', code: 45 },
];

/* ── The sun ─────────────────────────────────────────────────────────────
   Solar elevation from the low-precision formulas in the Astronomical
   Almanac — good to a fraction of a degree, which is a great deal better than
   a jar on a web page needs. Degrees above the horizon; negative is night. */
const RAD = Math.PI / 180;

export function sunElevation(date, lat, lon) {
    const d = date.getTime() / 86400000 - 10957.5;  // days since J2000.0
    const g = (357.529 + 0.98560028 * d) * RAD;
    const q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
    const e = (23.439 - 0.00000036 * d) * RAD;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const ha = ((gmst * 15 + lon) * RAD) - ra;
    const el = Math.asin(Math.sin(lat * RAD) * Math.sin(dec) + Math.cos(lat * RAD) * Math.cos(dec) * Math.cos(ha));
    return el / RAD;
}

/** Where the sun sits along its arc today, -1 (rising, east) to 1 (setting,
    west), from the hour angle — used to slide it across the jar. */
export function sunAzimuthish(date, lon, utcOffsetSec) {
    const local = (date.getTime() / 1000 + utcOffsetSec) / 3600;
    const h = ((local % 24) + 24) % 24;
    // Solar noon drifts from clock noon by longitude within the zone, but by
    // less than an hour almost everywhere; clock time is close enough to place
    // a disc in a jar.
    return Math.max(-1.2, Math.min(1.2, (h - 12) / 6));
}

/** Moon phase, 0 = new, 0.5 = full, from the mean synodic month. */
export function moonPhase(date) {
    const synodic = 29.530588853;
    const ref = Date.UTC(2000, 0, 6, 18, 14) / 86400000;  // a known new moon
    const days = date.getTime() / 86400000 - ref;
    return ((days % synodic) + synodic) % synodic / synodic;
}

/* ── Sky colour ──────────────────────────────────────────────────────────
   Keyed on sun elevation, so dusk in Stockholm in June lasts as long as it
   does there. Each stop is [elevation°, top colour, horizon colour]. Cloud
   and storm then wash it towards grey. */
const SKY = [
    [-18, [6, 8, 22], [14, 18, 40]],
    [-8, [14, 18, 48], [52, 40, 84]],
    [-2, [40, 44, 96], [230, 120, 90]],
    [3, [70, 110, 180], [250, 170, 110]],
    [12, [60, 130, 210], [170, 210, 240]],
    [35, [44, 120, 220], [150, 200, 245]],
];

function lerp(a, b, t) { return a + (b - a) * t; }
function mix(c1, c2, t) { return [0, 1, 2].map(i => Math.round(lerp(c1[i], c2[i], t))); }

export function skyColours(elevation, w) {
    let top, horizon;
    if (elevation <= SKY[0][0]) { top = SKY[0][1]; horizon = SKY[0][2]; }
    else if (elevation >= SKY[SKY.length - 1][0]) { const s = SKY[SKY.length - 1]; top = s[1]; horizon = s[2]; }
    else {
        let k = 0;
        while (SKY[k + 1][0] < elevation) k++;
        const [e0, t0, h0] = SKY[k], [e1, t1, h1] = SKY[k + 1];
        const t = (elevation - e0) / (e1 - e0);
        top = mix(t0, t1, t);
        horizon = mix(h0, h1, t);
    }
    // Overcast flattens the sky towards a grey of the same brightness.
    const grey = (c) => { const v = Math.round((c[0] + c[1] + c[2]) / 3); return [v, v, v + 6]; };
    const wash = Math.min(1, (w.cloud || 0) * 0.75 + (w.storm ? 0.25 : 0) + (w.fog || 0) * 0.4);
    top = mix(top, grey(top), wash);
    horizon = mix(horizon, grey(horizon), wash);
    if (w.storm) { top = mix(top, [20, 22, 30], 0.35); horizon = mix(horizon, [40, 42, 52], 0.35); }
    return { top, horizon, daylight: Math.max(0, Math.min(1, (elevation + 6) / 18)) };
}

/* ── Where the jar is, before anyone has said ──────────────────────────
   Asking for location the moment the page opens is rude, so the first guess
   comes from the browser's time zone, which needs no permission and is right
   to the nearest big city for most people. "Use my location" refines it. */
export const ZONES = {
    'Europe/Stockholm': ['Stockholm', 59.33, 18.07],
    'Europe/Oslo': ['Oslo', 59.91, 10.75],
    'Europe/Copenhagen': ['Copenhagen', 55.68, 12.57],
    'Europe/Helsinki': ['Helsinki', 60.17, 24.94],
    'Europe/London': ['London', 51.51, -0.13],
    'Europe/Dublin': ['Dublin', 53.35, -6.26],
    'Europe/Paris': ['Paris', 48.86, 2.35],
    'Europe/Berlin': ['Berlin', 52.52, 13.40],
    'Europe/Amsterdam': ['Amsterdam', 52.37, 4.90],
    'Europe/Madrid': ['Madrid', 40.42, -3.70],
    'Europe/Rome': ['Rome', 41.90, 12.50],
    'Europe/Zurich': ['Zurich', 47.38, 8.54],
    'Europe/Vienna': ['Vienna', 48.21, 16.37],
    'Europe/Warsaw': ['Warsaw', 52.23, 21.01],
    'Europe/Lisbon': ['Lisbon', 38.72, -9.14],
    'Europe/Athens': ['Athens', 37.98, 23.73],
    'America/New_York': ['New York', 40.71, -74.01],
    'America/Detroit': ['Detroit', 42.33, -83.05],
    'America/Chicago': ['Chicago', 41.88, -87.63],
    'America/Denver': ['Denver', 39.74, -104.99],
    'America/Phoenix': ['Phoenix', 33.45, -112.07],
    'America/Los_Angeles': ['Los Angeles', 34.05, -118.24],
    'America/Anchorage': ['Anchorage', 61.22, -149.90],
    'Pacific/Honolulu': ['Honolulu', 21.31, -157.86],
    'America/Toronto': ['Toronto', 43.65, -79.38],
    'America/Vancouver': ['Vancouver', 49.28, -123.12],
    'America/Mexico_City': ['Mexico City', 19.43, -99.13],
    'America/Sao_Paulo': ['São Paulo', -23.55, -46.63],
    'America/Argentina/Buenos_Aires': ['Buenos Aires', -34.60, -58.38],
    'Asia/Tokyo': ['Tokyo', 35.68, 139.69],
    'Asia/Seoul': ['Seoul', 37.57, 126.98],
    'Asia/Shanghai': ['Shanghai', 31.23, 121.47],
    'Asia/Hong_Kong': ['Hong Kong', 22.32, 114.17],
    'Asia/Singapore': ['Singapore', 1.35, 103.82],
    'Asia/Kolkata': ['Mumbai', 19.08, 72.88],
    'Asia/Dubai': ['Dubai', 25.20, 55.27],
    'Africa/Johannesburg': ['Johannesburg', -26.20, 28.05],
    'Africa/Cairo': ['Cairo', 30.04, 31.24],
    'Australia/Sydney': ['Sydney', -33.87, 151.21],
    'Australia/Melbourne': ['Melbourne', -37.81, 144.96],
    'Pacific/Auckland': ['Auckland', -36.85, 174.76],
};

export function guessPlace(timeZone) {
    const hit = ZONES[timeZone];
    if (hit) return { name: hit[0], lat: hit[1], lon: hit[2], guessed: true };
    // An unlisted zone falls back to Stockholm, which is where this site lives.
    return { name: 'Stockholm', lat: 59.33, lon: 18.07, guessed: true };
}

/* ── Open-Meteo ── */
export function forecastUrl(lat, lon) {
    const q = new URLSearchParams({
        latitude: lat.toFixed(3),
        longitude: lon.toFixed(3),
        current: 'temperature_2m,weather_code,wind_speed_10m,cloud_cover,is_day',
        wind_speed_unit: 'ms',
        timezone: 'auto',
    });
    return 'https://api.open-meteo.com/v1/forecast?' + q;
}

export function geocodeUrl(name) {
    const q = new URLSearchParams({ name, count: '1', language: 'en', format: 'json' });
    return 'https://geocoding-api.open-meteo.com/v1/search?' + q;
}

/** Turns a forecast response into the jar's state. Missing fields fall back
    to something calm rather than throwing: a half-answer still makes a sky. */
export function fromForecast(json) {
    const c = (json && json.current) || {};
    const code = Number.isFinite(c.weather_code) ? c.weather_code : 1;
    const w = describe(code);
    if (Number.isFinite(c.cloud_cover)) {
        // The reported cover is more precise than the code's guess; keep the
        // higher of the two so a rain code never comes with a clear sky.
        w.cloud = Math.max(w.cloud * 0.6, c.cloud_cover / 100);
    }
    return {
        ...w,
        code,
        temp: Number.isFinite(c.temperature_2m) ? c.temperature_2m : null,
        wind: Number.isFinite(c.wind_speed_10m) ? c.wind_speed_10m : 2,
        utcOffset: Number.isFinite(json && json.utc_offset_seconds) ? json.utc_offset_seconds : null,
        timeZone: (json && json.timezone) || null,
    };
}

/** What the weather probably is when nobody can be asked: a mild, partly
    cloudy day, cold enough to snow in a northern winter. */
export function offlineGuess(date, lat) {
    const month = date.getUTCMonth();
    const winter = lat >= 0 ? (month <= 1 || month === 11) : (month >= 5 && month <= 7);
    const w = describe(winter && Math.abs(lat) > 45 ? 71 : 2);
    return { ...w, code: winter ? 71 : 2, temp: winter ? -2 : 14, wind: 3, utcOffset: null, timeZone: null };
}

/** Local clock time at the jar, as "14:05", from a UTC offset in seconds. */
export function localTime(date, utcOffsetSec) {
    const t = new Date(date.getTime() + utcOffsetSec * 1000);
    return String(t.getUTCHours()).padStart(2, '0') + ':' + String(t.getUTCMinutes()).padStart(2, '0');
}

/** Snow lying on the ground, 0..1: builds while it snows, melts above zero. */
export function nextSnowCover(cover, w, dtSec) {
    if (w.snow > 0) return Math.min(1, cover + w.snow * dtSec * 0.02);
    const melt = (w.temp == null || w.temp > 0) ? 0.01 + (w.rain || 0) * 0.03 : 0;
    return Math.max(0, cover - melt * dtSec);
}
