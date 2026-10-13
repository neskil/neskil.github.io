// Pocket Weather Terrarium — the page: where the jar is, what its weather is,
// the card beside it and the loop. The jar itself, in 3D, is js/scene.js.
import {
    PRESETS, describe, sunElevation, sunAzimuthish, moonPhase, skyColours,
    guessPlace, forecastUrl, geocodeUrl, fromForecast, offlineGuess,
    localTime, nextSnowCover,
} from './weather.js';
import { createJar } from './scene.js';

const canvas = document.getElementById('jar');
const el = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ── State ── */
const state = {
    place: null,            // { name, lat, lon }
    live: null,             // the last real report, or an offline guess
    preset: null,           // a PRESETS id picked by hand, or null for live
    offline: false,
    warp: false,            // "watch a day": an hour a second
    warpHours: 0,
    snowCover: 0,
    gust: 0,                // a tap on the glass
};

function weather() {
    if (state.preset) {
        const p = PRESETS.find(x => x.id === state.preset);
        const w = describe(p.code);
        return { ...w, temp: p.id === 'snow' ? -3 : (state.live ? state.live.temp : 12), wind: p.id === 'storm' ? 9 : 3 };
    }
    return state.live || offlineGuess(new Date(), state.place ? state.place.lat : 59);
}

function simDate() {
    return new Date(Date.now() + state.warpHours * 3600000);
}

function frame(dt) {
    const w = weather();
    const date = simDate();
    const lat = state.place ? state.place.lat : 59.33, lon = state.place ? state.place.lon : 18.07;
    const offset = (state.live && state.live.utcOffset != null) ? state.live.utcOffset : -new Date().getTimezoneOffset() * 60;
    const elev = sunElevation(date, lat, lon);
    const sun = { el: elev, az: sunAzimuthish(date, lon, offset), phase: moonPhase(date), colours: skyColours(elev, w) };

    state.snowCover = nextSnowCover(state.snowCover, w, dt * (state.warp ? 20 : 4));
    state.gust = Math.max(0, state.gust - dt * 0.8);

    jar.setTag(state.place ? state.place.name : '…');
    jar.render({ w, sun, snowCover: state.snowCover, gust: state.gust, t, dt });

    updateCard(w, date, offset, elev);
}

/* ── The card under the jar ── */
let lastCard = '';
function updateCard(w, date, offset, elev) {
    const temp = w.temp == null ? '—' : Math.round(w.temp) + '°';
    const time = localTime(date, offset);
    const src = state.preset ? 'picked by hand' : state.offline ? 'offline guess' : 'live';
    const key = [state.place && state.place.name, temp, w.label, time, src, Math.round(w.wind)].join('|');
    if (key === lastCard) return;
    lastCard = key;
    el('place').textContent = state.place ? state.place.name : 'Finding your sky…';
    el('temp').textContent = temp;
    el('cond').textContent = w.label;
    el('clock').textContent = time + (state.warp ? ' ⏩' : '');
    el('wind').textContent = `${Math.round(w.wind)} m/s wind`;
    el('source').textContent = src;
    el('source').dataset.kind = state.preset ? 'hand' : state.offline ? 'offline' : 'live';
    el('sunline').textContent = elev > 0 ? `sun ${Math.round(elev)}° up` : elev > -6 ? 'twilight' : 'night';
}

/* ── Fetching ── */
async function loadWeather() {
    if (!state.place) return;
    try {
        const res = await fetch(forecastUrl(state.place.lat, state.place.lon));
        if (!res.ok) throw new Error(res.status);
        state.live = fromForecast(await res.json());
        state.offline = false;
    } catch (e) {
        state.live = offlineGuess(new Date(), state.place.lat);
        state.offline = true;
    }
    lastCard = '';
}

function setPlace(place, remember = true) {
    state.place = place;
    if (remember) {
        try { localStorage.setItem('terrarium.place', JSON.stringify(place)); } catch (e) { /* not remembered */ }
    }
    lastCard = '';
    loadWeather();
}

el('locate').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    el('locate').textContent = '📍 Locating…';
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        el('locate').textContent = '📍 My location';
        setPlace({ name: 'Your sky', lat, lon });
    }, () => {
        el('locate').textContent = '📍 Location blocked';
    }, { timeout: 10000, maximumAge: 600000 });
});

el('search').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = el('city').value.trim();
    if (!q) return;
    el('city').blur();
    try {
        const res = await fetch(geocodeUrl(q));
        const json = await res.json();
        const hit = json.results && json.results[0];
        if (!hit) { el('city').value = ''; el('city').placeholder = `No place called “${q}”`; return; }
        el('city').value = '';
        el('city').placeholder = 'Another city…';
        setPlace({ name: hit.name, lat: hit.latitude, lon: hit.longitude });
    } catch (err) {
        el('city').placeholder = 'Search needs a connection';
        el('city').value = '';
    }
});

/* ── Weather chips ── */
const chips = el('chips');
const live = document.createElement('button');
live.type = 'button';
live.className = 'chip';
live.dataset.preset = '';
live.textContent = '📡 Live';
chips.appendChild(live);
for (const p of PRESETS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.preset = p.id;
    b.textContent = `${p.emoji} ${p.label}`;
    chips.appendChild(b);
}
function setPreset(id) {
    state.preset = id || null;
    chips.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.preset || null) === state.preset)));
    lastCard = '';
}
chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (b) setPreset(b.dataset.preset);
});
setPreset(null);

el('warp').addEventListener('click', () => {
    state.warp = !state.warp;
    el('warp').setAttribute('aria-pressed', String(state.warp));
    if (!state.warp) state.warpHours = 0;
    lastCard = '';
});


/* ── The jar and the loop ──
   A tap on the glass is a gust: the tree bends, the rain and snow swirl.
   A drag turns the jar on its stand. */
let t = 0;
let jar;
try {
    jar = createJar(canvas, { onTap: () => { state.gust = 1; }, reduceMotion: () => reduceMotion.matches });
} catch (err) {
    const note = document.createElement('p');
    note.className = 'note no-gl';
    note.textContent = 'The jar needs WebGL, which this browser has turned off. The weather card still works.';
    canvas.replaceWith(note);
    jar = { render() {}, resize() {}, setTag() {}, ufo() {} };
}
new ResizeObserver(() => jar.resize()).observe(canvas.parentElement);

let last = performance.now();
function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;
    if (state.warp) state.warpHours += dt;   // an hour a second
    frame(dt);
    requestAnimationFrame(loop);
}

/* ── Start ── */
(function start() {
    const params = new URLSearchParams(location.search);
    if (params.get('weather') && PRESETS.some(p => p.id === params.get('weather'))) setPreset(params.get('weather'));
    if (params.get('hours')) state.warpHours = +params.get('hours') || 0;
    // ?at=2026-10-12T15:45Z pins the jar to a moment, for screenshots.
    if (params.get('at') && !isNaN(Date.parse(params.get('at')))) state.warpHours = (Date.parse(params.get('at')) - Date.now()) / 3600000;
    if (params.get('snow')) state.snowCover = Math.min(1, +params.get('snow') || 0);
    // ?ufo=3 calls the visitor three seconds in (five quick taps on the glass do too).
    if (params.has('ufo')) jar.ufo(+params.get('ufo') || 0);
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('terrarium.place')); } catch (e) { /* none */ }
    const lat = parseFloat(params.get('lat')), lon = parseFloat(params.get('lon'));
    if (Number.isFinite(lat) && Number.isFinite(lon)) setPlace({ name: params.get('name') || 'Somewhere', lat, lon }, false);
    else if (saved && Number.isFinite(saved.lat)) setPlace(saved, false);
    else setPlace(guessPlace(Intl.DateTimeFormat().resolvedOptions().timeZone), false);
    setInterval(loadWeather, 10 * 60 * 1000);
    requestAnimationFrame(loop);
})();
