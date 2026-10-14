/* ── The page ────────────────────────────────────────────────────────
   State lives in one object; every input writes to it and every change
   re-prices and redraws everything. The inputs are generated from the
   schema below, so a field is one line here rather than a block of HTML
   that can drift from the model's field names. */

import {
    COMPONENTS, ROUTES, POWERTRAINS, RESIDUAL_GROUPS, EXITS, LOANS, SCENARIOS,
    PRESETS, DEFAULTS, AVERAGE_MIL, ENERGY
} from './data.js';
import {
    priceAll, horizonSeries, mileageSeries, encodeState, decodeState, fmtKr, fmtNum,
    leaseAllowance, leaseQuoteOf, subPriceOf, rentPriceOf, helInsurance, serviceYear,
    newPriceOf, noCarMil, loanTypeOf, energyPerMil
} from './model.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ROUTE_BY_KEY = Object.fromEntries(ROUTES.map(r => [r.key, r]));
const routeColor = (key) => `var(--r-${key})`;
const compColor = (i) => `var(--s${i + 1})`;

let state = decodeState(location.search.slice(1));

/* ── Schema ────────────────────────────────────────────────────── */
const opt = (obj, label = v => v.label) => Object.entries(obj).map(([value, v]) => ({ value, label: label(v) }));

const GROUPS = [
    {
        id: 'car', sign: 'Bilen', en: 'Your car', open: true, fields: [
            { type: 'presets' },
            { key: 'price', label: 'Price you pay', unit: 'kr', step: 1000, car: true },
            { key: 'age', label: 'Age when you buy it', unit: 'years', step: 1, max: 20, car: true, help: '0 means new. Leasing and subscriptions always give you a new one.' },
            { key: 'powertrain', label: 'Powertrain', type: 'select', options: opt(POWERTRAINS, v => `${v.label} · ${v.sv}`), car: true },
            { key: 'co2', label: 'CO₂ (WLTP)', unit: 'g/km', step: 1, car: true, showIf: s => s.powertrain !== 'el', help: 'From the registration certificate or the price list. Sets the malus.' },
            { key: 'group', label: 'Brand (sets resale)', type: 'select', options: opt(RESIDUAL_GROUPS), car: true }
        ]
    },
    {
        id: 'driving', sign: 'Körning', en: 'Your driving', open: true, fields: [
            { key: 'horizon', label: 'How long you keep it', type: 'range', min: 6, max: 96, step: 3, show: v => `${v} months${v % 12 === 0 ? ` (${v / 12} yr)` : ''}` },
            { key: 'mil', label: 'Mil a year', type: 'range', min: 200, max: 4000, step: 50, show: v => `${fmtNum(v)} mil · ${fmtNum(v * 10)} km` },
            {
                key: 'congestion', label: 'Trängselskatt', unit: 'kr/mo', step: 50,
                presets: [['None', 0], ['Göteborg commute ≈', 700], ['Stockholm commute ≈', 1200]],
                help: 'A daily commute runs to about 14 500 kr a year in Stockholm and 8 500 in Göteborg (≈). Caps: 135 and 60 kr a day.'
            },
            { key: 'parking', label: 'Parking', unit: 'kr/mo', step: 50, help: 'A residents\' permit or a garage space, if you pay for one.' },
            { key: 'bigCity', type: 'toggle', label: 'I live in Stockholm, Göteborg or Malmö', sv: 'Raises the insurance estimate' },
            { key: 'young', type: 'toggle', label: 'A driver under 25', sv: 'Raises the insurance estimate' }
        ]
    },
    {
        id: 'money', sign: 'Pengar & kredit', en: 'Money & credit', open: true, fields: [
            { key: 'savings', label: 'Savings you could use', unit: 'kr', step: 10000 },
            {
                key: 'altReturn', label: 'What the savings earn', unit: '% a year', step: 0.1,
                presets: [['Savings account', 2], ['Mixed', 4], ['Index fund', 7]],
                help: 'The return cash gives up. Riksbanken\'s rate is 1.75 %.'
            },
            { key: 'loanType', label: 'Loan', type: 'select', options: opt(LOANS, v => `${v.sv}`) },
            { key: 'loanRate', label: 'Effective rate (effektiv ränta)', unit: '%', step: 0.05, auto: s => (loanTypeOf(s).rate * 100).toFixed(2) },
            { key: 'down', label: 'Down payment (kontantinsats)', unit: '%', step: 5, help: 'A dealer loan needs 20 % by law; below that, the gap is lent unsecured with no deduction.' },
            { key: 'loanTerm', label: 'Loan term', unit: 'months', step: 12 },
            { key: 'exit', label: 'How you sell at the end', type: 'select', options: opt(EXITS) },
            { key: 'remark', type: 'toggle', label: 'I have a payment remark', sv: 'Betalningsanmärkning' },
            { key: 'income', type: 'toggle', label: 'Steady income', sv: 'Fast inkomst (lenders and lessors check)' },
            { key: 'card', type: 'toggle', label: 'I have a credit card', sv: 'Rental desks want one' },
            { key: 'home', type: 'toggle', label: 'I own a home with room in the mortgage', sv: 'Allows a mortgage top-up' }
        ]
    },
    {
        id: 'lease', sign: 'Privatleasing', en: 'Private lease', fields: [
            { key: 'leaseQuote', label: 'Quote at 1 000 mil a year', unit: 'kr/mo', step: 10, auto: s => leaseQuoteOf({ ...s, leaseQuote: null }), help: 'Advertised prices are usually at 1 000 mil. Each 500 more ≈ +300 kr.' },
            { key: 'leaseMil', label: 'Mil a year you sign for', unit: 'mil', step: 500, auto: s => leaseAllowance({ ...s, leaseMil: null }) },
            { key: 'leaseTerm', label: 'Term', unit: 'months', step: 12 },
            { key: 'overMil', label: 'Övermil', unit: 'kr/mil', step: 1, help: '10–20 kr a mil; Volvo charges 12.' },
            { key: 'returnDamage', label: 'Wear charged at return', unit: 'kr', step: 500, help: 'An expectation, not a quote. The pessimistic outlook triples it.' },
            { key: 'leaseService', type: 'toggle', label: 'Service included', sv: 'Serviceavtal ingår' }
        ]
    },
    {
        id: 'sub', sign: 'Bilabonnemang', en: 'Car subscription', fields: [
            { key: 'subPrice', label: 'Monthly price', unit: 'kr/mo', step: 10, auto: s => subPriceOf({ ...s, subPrice: null }), help: 'Including insurance, vehicle tax, service and tyres. Kinto Flex from 5 999 kr.' },
            { key: 'subMil', label: 'Mil included', unit: 'mil/mo', step: 10 },
            { key: 'subExcess', label: 'Extra mil', unit: 'kr/mil', step: 1 },
            { key: 'subMin', label: 'Shortest stay incl. notice', unit: 'months', step: 1 }
        ]
    },
    {
        id: 'rental', sign: 'Långtidshyra', en: 'Monthly rental', fields: [
            { key: 'rentPrice', label: 'Monthly price', unit: 'kr/mo', step: 10, auto: s => rentPriceOf({ ...s, rentPrice: null }), help: 'Avis Minilease from 7 495 kr for a Peugeot 2008-sized car.' },
            { key: 'rentMil', label: 'Mil included', unit: 'mil/mo', step: 10 },
            { key: 'rentExcess', label: 'Extra mil', unit: 'kr/mil', step: 1 }
        ]
    },
    {
        id: 'nocar', sign: 'Utan bil', en: 'No car', fields: [
            { key: 'transit', type: 'toggle', label: 'Monthly transit pass', sv: 'SL 30 dagar was 1 060 kr in 2025' },
            { key: 'transitPrice', label: 'Transit pass', unit: 'kr/mo', step: 10, showIf: s => s.transit },
            { key: 'poolTrips', label: 'Car-sharing trips', unit: 'a month', step: 1 },
            { key: 'poolHours', label: 'Hours per trip', unit: 'h', step: 0.5 },
            { key: 'poolKm', label: 'Distance per trip', unit: 'km', step: 5 },
            { key: 'poolHourly', label: 'Car-sharing hour', unit: 'kr/h', step: 1, help: 'Kinto Share from 45–65 kr, M from 69 kr.' },
            { key: 'poolPerKm', label: 'Car-sharing distance', unit: 'kr/km', step: 0.05 },
            { key: 'holidayWeeks', label: 'Holiday hire', unit: 'weeks/yr', step: 1 },
            { key: 'weekPrice', label: 'A week\'s hire', unit: 'kr', step: 100 }
        ]
    },
    {
        id: 'benefit', sign: 'Förmånsbil', en: 'Company car', fields: [
            { key: 'benefit', type: 'toggle', label: 'My employer offers a company car', sv: 'Adds it to the comparison' },
            { key: 'marginalTax', label: 'Your marginal tax', unit: '%', step: 1, showIf: s => s.benefit, presets: [['Municipal only', 32], ['Above brytpunkt', 52]] },
            { key: 'grossDeduction', label: 'Gross salary deduction', unit: 'kr/mo', step: 100, showIf: s => s.benefit, help: 'Personalbil via bruttolöneavdrag; 0 for a plain förmånsbil.' }
        ]
    },
    {
        id: 'running', sign: 'Driftkostnader', en: 'Running costs', fields: [
            { key: 'petrol', label: 'Petrol 95', unit: 'kr/l', step: 0.1, showIf: s => POWERTRAINS[s.powertrain]?.fuel === 'petrol', help: '19.40 kr today; about 22.50 once the tax cut ends on 1 December.' },
            { key: 'diesel', label: 'Diesel', unit: 'kr/l', step: 0.1, showIf: s => s.powertrain === 'diesel', help: '23.10 kr today; about 25.80 from 1 December.' },
            {
                key: 'homeKwh', label: 'Home charging', unit: 'kr/kWh', step: 0.05, showIf: s => POWERTRAINS[s.powertrain]?.kwhPerMil > 0,
                presets: Object.entries(ENERGY.zones).map(([z, v]) => [z, v]),
                help: 'All-in: grid fee, energy tax and VAT. By elområde ≈; SE1 is the north, SE4 Skåne.'
            },
            { key: 'publicKwh', label: 'Public charging', unit: 'kr/kWh', step: 0.1, showIf: s => POWERTRAINS[s.powertrain]?.kwhPerMil > 0, help: 'Ionity: 5.70 in the app, 6.00 by card.' },
            { key: 'homeShare', label: 'Charged at home', unit: '%', step: 5, showIf: s => POWERTRAINS[s.powertrain]?.kwhPerMil > 0 },
            {
                key: 'consumption', label: 'Consumption', step: 0.01,
                unitFn: s => s.powertrain === 'el' ? 'kWh/mil' : 'l/mil',
                auto: s => { const p = POWERTRAINS[s.powertrain]; return s.powertrain === 'el' ? p.kwhPerMil : p.litrePerMil; },
                help: 'A year\'s average including winter. For a plug-in hybrid, litres when running on fuel.'
            },
            { key: 'insurance', label: 'Helförsäkring', unit: 'kr/yr', step: 100, auto: s => Math.round(helInsurance({ ...s, insurance: null }, s.price)), help: 'Halvförsäkring is used while the three-year vagnskadegaranti runs.' },
            { key: 'service', label: 'Service & repairs', unit: 'kr/yr', step: 100, auto: s => Math.round(serviceYear({ ...s, service: null }, s.age)) },
            { key: 'hotel', type: 'toggle', label: 'Tyre hotel', sv: 'Däckhotell, ≈ 1 200 kr a year' }
        ]
    }
];

/* ── Inputs ────────────────────────────────────────────────────── */
const chevron = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';

function fieldHtml(f) {
    const id = 'f-' + f.key;
    if (f.type === 'presets') {
        return `<div class="field"><span class="label">Start from</span><div class="chips" id="presetChips">${
            PRESETS.map(p => `<button type="button" class="chip" data-preset="${p.key}">${esc(p.label)}</button>`).join('')
        }</div></div>`;
    }
    if (f.type === 'toggle') {
        return `<label class="toggle" data-field="${f.key}"><input type="checkbox" id="${id}" data-key="${f.key}"><span>${esc(f.label)}${f.sv ? `<span class="sv">${esc(f.sv)}</span>` : ''}</span></label>`;
    }
    const help = f.help ? `<span class="help">${esc(f.help)}</span>` : '';
    const presets = f.presets ? `<div class="chips">${f.presets.map(([l, v]) => `<button type="button" class="chip" data-set="${f.key}" data-value="${v}">${esc(l)}</button>`).join('')}</div>` : '';
    if (f.type === 'range') {
        return `<div class="field" data-field="${f.key}"><label for="${id}"><span>${esc(f.label)}</span><span class="range-val" id="${id}-val"></span></label>
            <input type="range" id="${id}" data-key="${f.key}" min="${f.min}" max="${f.max}" step="${f.step}">${help}</div>`;
    }
    if (f.type === 'select') {
        return `<div class="field" data-field="${f.key}"><label for="${id}"><span>${esc(f.label)}</span></label>
            <div class="input-row"><select id="${id}" data-key="${f.key}">${f.options.map(o => `<option value="${o.value}">${esc(o.label)}</option>`).join('')}</select></div>${help}</div>`;
    }
    const auto = f.auto ? `<span class="auto-tag" id="${id}-auto" title="Left empty, this is estimated. Type to use your own figure.">auto</span>` : '';
    return `<div class="field" data-field="${f.key}"><label for="${id}"><span>${esc(f.label)}</span>${auto}</label>
        <div class="input-row"><input type="number" inputmode="decimal" id="${id}" data-key="${f.key}" min="0" step="${f.step || 1}"${f.max ? ` max="${f.max}"` : ''}><span class="unit" id="${id}-unit">${esc(f.unit || '')}</span></div>${presets}${help}</div>`;
}

function buildInputs() {
    $('#inputs').innerHTML = GROUPS.map(g => `
        <details class="group" id="g-${g.id}"${g.open ? ' open' : ''}>
            <summary><span class="sign">${esc(g.sign)}</span><span class="g-en">${esc(g.en)}</span>${chevron}</summary>
            <div class="group-body">${g.fields.map(fieldHtml).join('')}</div>
        </details>`).join('');

    $('#inputs').addEventListener('input', onInput);
    $('#inputs').addEventListener('change', onInput);
    $('#inputs').addEventListener('click', (e) => {
        const p = e.target.closest('[data-preset]');
        if (p) return applyPreset(p.dataset.preset);
        const s = e.target.closest('[data-set]');
        if (s) { state[s.dataset.set] = Number(s.dataset.value); update(); }
    });
}

const FIELD_BY_KEY = Object.fromEntries(GROUPS.flatMap(g => g.fields).filter(f => f.key).map(f => [f.key, f]));

function onInput(e) {
    const el = e.target;
    const key = el.dataset.key;
    if (!key) return;
    const f = FIELD_BY_KEY[key];
    if (el.type === 'checkbox') state[key] = el.checked;
    else if (el.tagName === 'SELECT') state[key] = el.value;
    else {
        if (el.value === '') {
            if (f.auto) state[key] = null;
            else return;
        } else {
            const n = Number(el.value);
            if (!Number.isFinite(n) || n < 0) return;
            state[key] = n;
        }
    }
    if (f.car) state.preset = 'custom';
    /* A new loan type brings its own rate unless you typed one. */
    if (key === 'loanType' && e.type === 'change') {
        state.loanRate = null;
    }
    if (key === 'powertrain' && e.type === 'change') {
        state.co2 = POWERTRAINS[state.powertrain].co2;
        state.consumption = null;
    }
    update(el);
}

function applyPreset(key) {
    const p = PRESETS.find(x => x.key === key);
    if (!p) return;
    Object.assign(state, {
        preset: p.key, price: p.price, age: p.age, powertrain: p.powertrain, co2: p.co2, group: p.group,
        leaseQuote: p.leaseQuote != null ? p.leaseQuote : null, consumption: p.consumption != null ? p.consumption : null
    });
    update();
}

/* Write state back into the fields — all of them, except the one being
   typed in, so a half-typed number is not reformatted under the cursor. */
function syncInputs(active) {
    for (const g of GROUPS) {
        for (const f of g.fields) {
            if (f.type === 'presets') {
                document.querySelectorAll('#presetChips .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.preset === state.preset)));
                continue;
            }
            const el = document.getElementById('f-' + f.key);
            const wrap = el && el.closest('[data-field]');
            if (wrap && f.showIf) wrap.hidden = !f.showIf(state);
            if (!el) continue;
            if (f.type === 'toggle') el.checked = !!state[f.key];
            else if (f.type === 'range') {
                if (el !== active) el.value = state[f.key];
                $('#f-' + f.key + '-val').textContent = f.show(state[f.key]);
            } else if (f.type === 'select') el.value = state[f.key];
            else if (el !== active) {
                el.value = state[f.key] == null ? '' : state[f.key];
            }
            if (f.auto) {
                const a = f.auto(state);
                el.placeholder = typeof a === 'number' ? String(Math.round(a * 100) / 100) : a;
                const tag = $('#f-' + f.key + '-auto');
                if (tag) tag.hidden = state[f.key] != null;
            }
            if (f.unitFn) $('#f-' + f.key + '-unit').textContent = f.unitFn(state);
            if (f.presets && wrap) wrap.querySelectorAll('[data-set]').forEach(c => c.setAttribute('aria-pressed', String(Number(c.dataset.value) === state[f.key])));
        }
    }
}

/* ── Scenario chips ───────────────────────────────────────────── */
function buildScenarios() {
    $('#scenarioChips').innerHTML = Object.entries(SCENARIOS).map(([k, s]) =>
        `<button type="button" class="chip" data-scenario="${k}" title="${esc(s.sv)}">${esc(s.label)}</button>`).join('');
    $('#scenarioChips').addEventListener('click', (e) => {
        const b = e.target.closest('[data-scenario]');
        if (b) { state.scenario = b.dataset.scenario; update(); }
    });
}

/* ── Verdict ──────────────────────────────────────────────────── */
function plate(amount, unit) {
    return `<span class="plate" aria-label="${esc(fmtKr(amount))} ${esc(unit)}"><span class="eu" aria-hidden="true"><span class="stars"></span>S</span><span class="chars">${fmtNum(amount)}<span class="unit">kr${unit}</span></span></span>`;
}

function renderVerdict(res) {
    const N = res.horizon;
    const best = res.cheapestCar;
    const el = $('#verdict');
    if (!best) {
        el.innerHTML = `<div class="verdict-kicker">No route is open</div><p>Every way to a car is shut by your answers under "Money &amp; credit". Going without costs ${fmtKr(res.routes.find(r => r.key === 'nocar').perMonth)} a month.</p>`;
        return;
    }
    const carRoutes = res.routes.filter(r => r.key !== 'nocar' && r.gate.open && !(r.key === 'benefit' && !state.benefit))
        .sort((a, b) => a.total - b.total);
    const next = carRoutes[1];
    const lines = [];
    lines.push(`<strong>${fmtNum(best.perMil)} kr per mil</strong> and ${fmtKr(best.total)} over ${N} months, everything included.`);
    if (next) lines.push(`Next best: <strong>${esc(next.sv)}</strong> at ${fmtKr(next.perMonth - best.perMonth)} a month more.`);
    const any = res.cheapestCarAny;
    if (any && any.key !== best.key && !any.gate.open) {
        lines.push(`<strong>${esc(any.sv)}</strong> would be ${fmtKr(best.perMonth - any.perMonth)} a month cheaper, but ${esc(any.gate.reason.charAt(0).toLowerCase() + any.gate.reason.slice(1))}.`);
    }
    const nocar = res.routes.find(r => r.key === 'nocar');
    lines.push(`Going without a car: ${fmtKr(nocar.perMonth)} a month, covering about ${fmtNum(nocar.mil)} mil a year by car sharing and holiday hire against your ${fmtNum(state.mil)}.`);
    if (state.age > 0 && ['lease', 'sub', 'rental', 'benefit'].includes(best.key)) {
        lines.push(`Note that ${esc(best.sv.toLowerCase())} prices a <em>new</em> car; cash and loan price the ${state.age}-year-old one.`);
    }
    el.innerHTML = `
        <div class="verdict-kicker">Cheapest way to have a car · ${N} months · ${fmtNum(state.mil)} mil a year</div>
        <div class="verdict-head">
            <h2>${esc(best.sv)}<small>${esc(ROUTE_BY_KEY[best.key].label)}</small></h2>
            ${plate(best.perMonth, '/mån')}
        </div>
        ${lines.map(l => `<p>${l}</p>`).join('')}`;
}

/* ── Route tiles ──────────────────────────────────────────────── */
function routeNote(r) {
    switch (r.key) {
        case 'cash': return `Sold after ${state.horizon} months: ${EXITS[state.exit].sv.toLowerCase()}`;
        case 'loan': return `${fmtKr(r.payment)}/mo for ${state.loanTerm} months at ${(r.rate * 100).toFixed(2)} %${r.gapShare > 0 ? ', part unsecured' : ''}`;
        case 'lease': return `${fmtKr(r.monthly)}/mo, ${fmtNum(r.allowance)} mil/yr${r.billed > state.horizon ? `, ${r.billed}-month term billed in full` : ''}`;
        case 'sub': return `${fmtKr(r.monthly)}/mo all-in${r.billed > state.horizon ? `, ${r.billed} months minimum` : ''}`;
        case 'rental': return `${fmtKr(r.monthly)}/mo, ${fmtNum(state.rentMil)} mil/mo included`;
        case 'nocar': return `Covers ≈ ${fmtNum(r.mil)} mil a year`;
        case 'benefit': return `Benefit value ${fmtKr(r.benefitValue)}/yr`;
    }
    return '';
}

function renderRoutes(res) {
    const best = res.cheapestCar;
    $('#routes').innerHTML = res.routes.filter(r => r.key !== 'benefit' || state.benefit).map(r => {
        const closed = !r.gate.open;
        const isBest = best && r.key === best.key;
        const badge = isBest ? '<span class="badge">Cheapest</span>' : closed ? '<span class="badge">Closed</span>' : '';
        return `<article class="route${isBest ? ' is-best' : ''}${closed ? ' is-closed' : ''}" style="--swatch:${routeColor(r.key)}">
            ${badge}
            <div class="r-sv">${esc(r.sv)}</div>
            <div class="r-en">${esc(ROUTE_BY_KEY[r.key].label)}</div>
            <div class="r-cost">${fmtNum(r.perMonth)} <span>kr/mo</span></div>
            <div class="r-mil">${fmtNum(r.perMil)} kr/mil</div>
            ${closed ? `<div class="r-reason">${esc(r.gate.reason)}</div>` : `<div class="r-note">${esc(routeNote(r))}</div>`}
        </article>`;
    }).join('');
}

/* ── Stacked breakdown ────────────────────────────────────────── */
let lastRes = null;

function renderBars(res) {
    lastRes = res;
    const N = res.horizon;
    const rows = res.routes.filter(r => r.key !== 'benefit' || state.benefit);
    const max = Math.max(...rows.map(r => COMPONENTS.reduce((s, c) => s + Math.max(0, r.components[c.key]), 0) / N));
    $('#componentLegend').innerHTML = COMPONENTS.map((c, i) => `<span><i style="--c:${compColor(i)}"></i>${esc(c.label)}</span>`).join('');
    $('#bars').innerHTML = rows.map(r => {
        const segs = COMPONENTS.map((c, i) => {
            const v = r.components[c.key] / N;
            if (v <= 0.5) return '';
            const pct = v / max * 100;
            const label = pct > 11 ? fmtNum(v) : '';
            return `<div class="bar-seg" style="--c:${compColor(i)};width:${pct}%" data-route="${r.key}" data-comp="${c.key}">${label}</div>`;
        }).join('');
        const cls = (!r.gate.open ? ' is-closed' : '') + (res.cheapestCar && r.key === res.cheapestCar.key ? ' is-best' : '');
        return `<div class="bar-row${cls}">
            <div class="bar-label">${esc(r.sv)}<small>${esc(ROUTE_BY_KEY[r.key].label)}</small></div>
            <div class="bar-track">${segs}</div>
            <div class="bar-total">${fmtNum(r.perMonth)}</div>
        </div>`;
    }).join('');
    $('#breakdownSub').textContent = `Kronor a month, averaged over ${N} months. Hover a block for what is in it.`;
    const best = res.cheapestCar;
    $('#breakdownCaption').innerHTML = best
        ? `Every route pays for the same driving (${fmtNum(state.mil)} mil a year) except <em>Utan bil</em>, which drives what car sharing and a summer hire cover. "Value lost &amp; payments" is what the car itself costs you: the drop in value for an owner, the fee for everyone else. Interest includes the return your money would have earned at ${state.altReturn} %.`
        : '';

    const head = `<tr><th>Route</th>${COMPONENTS.map(c => `<th>${esc(c.short)}</th>`).join('')}<th>Per month</th><th>Per mil</th></tr>`;
    const body = rows.map(r => `<tr><td>${esc(r.sv)}${r.gate.open ? '' : ' (closed)'}</td>${COMPONENTS.map(c => `<td>${fmtNum(r.components[c.key] / N)}</td>`).join('')}<td>${fmtNum(r.perMonth)}</td><td>${fmtNum(r.perMil)}</td></tr>`).join('');
    $('#breakdownTable').innerHTML = `<table class="data"><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function barTip(seg) {
    const r = lastRes.routes.find(x => x.key === seg.dataset.route);
    const ci = COMPONENTS.findIndex(c => c.key === seg.dataset.comp);
    const c = COMPONENTS[ci];
    const N = lastRes.horizon;
    const det = (r.detail[c.key] || {});
    const rows = Object.entries(det).filter(([, v]) => Math.abs(v) >= 1)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .map(([k, v]) => `<div class="t-row is-sub"><span>${esc(k)}</span><span>${fmtNum(v / N)}</span></div>`).join('');
    return `<div class="t-head">${esc(r.sv)}</div>
        <div class="t-row"><span><i style="--c:${compColor(ci)}"></i>${esc(c.label)}</span><span>${fmtNum(r.components[c.key] / N)} kr/mo</span></div>${rows}`;
}

/* ── Line charts ──────────────────────────────────────────────── */
function niceMax(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * p >= v) return m * p;
    return 10 * p;
}

function lineChart(container, series, opts) {
    const W = 640, H = 270, M = { l: 52, r: 96, t: 14, b: 30 };
    const clipId = 'clip-' + container.id;
    const keys = opts.keys;
    const xs = series.map(d => d.x);
    const x0 = xs[0], x1 = xs[xs.length - 1];
    /* Scale to the points from `yFrom` on: a lease left after six months
       bills its whole term and would otherwise flatten every other line.
       What runs above the top is clipped, and the tooltip still has it. */
    const scaled = series.filter(d => opts.yFrom == null || d.x >= opts.yFrom);
    const yMax = niceMax(Math.max(...scaled.flatMap(d => keys.map(k => d.values[k]))) * 1.04);
    const X = v => M.l + (v - x0) / (x1 - x0) * (W - M.l - M.r);
    const Y = v => H - M.b - v / yMax * (H - M.t - M.b);
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => t * yMax);
    const grid = yTicks.map(t => `<line x1="${M.l}" x2="${W - M.r}" y1="${Y(t)}" y2="${Y(t)}"/>`).join('');
    const yLabels = yTicks.map(t => `<text x="${M.l - 8}" y="${Y(t) + 4}" text-anchor="end">${fmtNum(t)}</text>`).join('');
    const xLabels = opts.xTicks.map(t => `<text x="${X(t)}" y="${H - 8}" text-anchor="middle">${esc(opts.xFmt(t))}</text>`).join('');
    const paths = keys.map(k => {
        const d = series.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.values[k]).toFixed(1)}`).join('');
        const closed = opts.closed.includes(k);
        return `<g class="series${closed ? ' is-closed' : ''}" clip-path="url(#${clipId})"><path d="${d}" stroke="${routeColor(k)}" stroke-dasharray="${ROUTE_BY_KEY[k].dash}"/></g>`;
    }).join('');
    /* End labels, pushed apart so none overlap. */
    const ends = keys.map(k => ({ k, y: Math.max(M.t, Y(series[series.length - 1].values[k])) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
    const labels = ends.map(e => `<text class="end-label" x="${W - M.r + 8}" y="${e.y + 4}">${esc(ROUTE_BY_KEY[e.k].sv)}</text>`).join('');
    const mx = X(Math.min(x1, Math.max(x0, opts.marker)));
    const marker = `<line class="marker" x1="${mx}" x2="${mx}" y1="${M.t}" y2="${H - M.b}"/><text class="marker-label" x="${mx + 4}" y="${M.t + 10}">${esc(opts.markerLabel)}</text>`;

    container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria)}">
        <defs><clipPath id="${clipId}"><rect x="${M.l - 2}" y="${M.t - 2}" width="${W - M.l - M.r + 4}" height="${H - M.t - M.b + 4}"/></clipPath></defs>
        <g class="grid">${grid}</g>
        <g class="axis">${yLabels}${xLabels}</g>
        ${paths}${labels}${marker}
        <g class="hover" pointer-events="none"></g>
        <rect x="${M.l}" y="${M.t}" width="${W - M.l - M.r}" height="${H - M.t - M.b}" fill="transparent" class="hit"/>
    </svg>`;

    const svg = container.querySelector('svg');
    const hover = svg.querySelector('.hover');
    const hit = svg.querySelector('.hit');
    const move = (ev) => {
        const pt = svg.createSVGPoint();
        pt.x = ev.clientX; pt.y = ev.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        let best = 0, bd = Infinity;
        series.forEach((d, i) => { const dd = Math.abs(X(d.x) - p.x); if (dd < bd) { bd = dd; best = i; } });
        const d = series[best];
        hover.innerHTML = `<line class="cross" x1="${X(d.x)}" x2="${X(d.x)}" y1="${M.t}" y2="${H - M.b}"/>` +
            keys.filter(k => d.values[k] <= yMax).map(k => `<circle class="dot" cx="${X(d.x)}" cy="${Y(d.values[k])}" r="4.5" fill="${routeColor(k)}"/>`).join('');
        const rows = keys.slice().sort((a, b) => d.values[a] - d.values[b]).map(k =>
            `<div class="t-row"><span><i style="--c:${routeColor(k)}"></i>${esc(ROUTE_BY_KEY[k].sv)}${opts.closed.includes(k) ? ' (closed)' : ''}</span><span>${fmtNum(d.values[k])} kr/mo</span></div>`).join('');
        showTip(`<div class="t-head">${esc(opts.xFmt(d.x, true))}</div>${rows}`, ev);
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { hover.innerHTML = ''; hideTip(); });
}

function renderLines(res) {
    const keys = res.routes.filter(r => r.key !== 'benefit' || state.benefit).map(r => r.key);
    const closed = res.routes.filter(r => !r.gate.open).map(r => r.key);
    const legend = keys.map(k => `<span><i class="line" style="--c:${routeColor(k)}"></i>${esc(ROUTE_BY_KEY[k].sv)}</span>`).join('');
    $('#routeLegend1').innerHTML = legend;
    $('#routeLegend2').innerHTML = legend;

    const months = [];
    for (let m = 6; m <= 96; m += 3) months.push(m);
    lineChart($('#horizonChart'), horizonSeries(state, months), {
        keys, closed,
        xTicks: [12, 24, 36, 48, 60, 72, 84, 96],
        xFmt: (v, long) => long ? `${v} months` : `${v / 12} yr`,
        marker: state.horizon, markerLabel: 'you', yFrom: 12,
        aria: 'Monthly cost of each route against how long you keep the car'
    });

    const mils = [];
    for (let m = 250; m <= 4000; m += 250) mils.push(m);
    lineChart($('#milChart'), mileageSeries(state, mils), {
        keys, closed,
        xTicks: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000],
        xFmt: (v, long) => long ? `${fmtNum(v)} mil a year` : fmtNum(v),
        marker: state.mil, markerLabel: 'you',
        aria: 'Monthly cost of each route against mil driven a year'
    });
}

/* ── How to decide ────────────────────────────────────────────── */
function renderGates(res) {
    const g = [
        { lit: state.horizon < 12, html: '<b>Less than a year?</b> Then it is a subscription or a monthly rental: a lease bills its whole term, and buying and selling within a year loses the first year\'s drop and two dealer margins.' },
        { lit: state.remark || !state.income, html: '<b>A payment remark, or no steady income?</b> Lenders and lessors run a UC check and want an income. Cash, a monthly rental on a card, or going without are what stay open.' },
        { lit: state.savings < state.price, html: `<b>Savings short of the price?</b> Then it is a loan, a lease or a subscription. ${state.savings < state.price ? `You are ${fmtKr(state.price - state.savings)} short of buying outright.` : ''}` },
        { lit: state.mil > 2000, html: '<b>Driving more than 2 000 mil a year?</b> Owning usually wins: a lease prices every extra mil and a subscription caps them, while an owner only loses a little resale.' }
    ];
    const best = res.cheapestCar;
    /* Each gate is a warning triangle, numbered; your own are lit. */
    const warn = (n) => `<svg class="warn-sign" viewBox="0 0 34 30" aria-hidden="true"><path d="M17 3 L31.5 27.5 H2.5 Z" fill="#fecc02" stroke="#d4202a" stroke-width="3" stroke-linejoin="round"/><text x="17" y="24.5" text-anchor="middle" font-family="Barlow Semi Condensed, Outfit, sans-serif" font-weight="700" font-size="13" fill="#111">${n}</text></svg>`;
    $('#gates').innerHTML = g.map((x, i) => `<div class="gate${x.lit ? ' is-lit' : ''}">${warn(i + 1)}<div>${x.html}</div></div>`).join('') +
        `<div class="gate is-lit is-final"><span class="info-sign" aria-hidden="true">i</span><div><b>Then the money decides.</b> ${best ? `For you that is <b>${esc(best.sv)}</b> at ${fmtKr(best.perMonth)} a month.` : 'Nothing is open; see the routes above.'}</div></div>`;
}

/* ── Tooltip ──────────────────────────────────────────────────── */
const tip = $('#tip');
function showTip(html, ev) {
    tip.innerHTML = html;
    tip.hidden = false;
    const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
    if (y + h > innerHeight - 8) y = ev.clientY - h - pad;
    tip.style.left = Math.max(8, x) + 'px';
    tip.style.top = Math.max(8, y) + 'px';
}
function hideTip() { tip.hidden = true; }

document.addEventListener('pointerover', (e) => {
    const seg = e.target.closest && e.target.closest('.bar-seg');
    if (seg) showTip(barTip(seg), e);
});
document.addEventListener('pointermove', (e) => {
    const seg = e.target.closest && e.target.closest('.bar-seg');
    if (seg) showTip(barTip(seg), e);
});
document.addEventListener('pointerout', (e) => {
    if (e.target.closest && e.target.closest('.bar-seg')) hideTip();
});

/* ── Share ────────────────────────────────────────────────────── */
function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, 2200);
}

$('#shareBtn').addEventListener('click', async () => {
    const q = encodeState(state);
    const url = location.origin + location.pathname + (q ? '?' + q : '');
    try {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
    } catch {
        prompt('Copy this link', url);
    }
});

let urlTimer = null;
function syncUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
        const q = encodeState(state);
        history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    }, 300);
}

/* ── Update ───────────────────────────────────────────────────── */
function update(active) {
    syncInputs(active);
    document.querySelectorAll('#scenarioChips .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.scenario === state.scenario)));
    const res = priceAll(state);
    renderVerdict(res);
    renderRoutes(res);
    renderBars(res);
    renderLines(res);
    renderGates(res);
    syncUrl();
}

buildScenarios();
buildInputs();
update();

/* For the screenshot recipe and the console. */
window.__bil = { get state() { return state; }, set: (s) => { Object.assign(state, s); update(); }, priceAll, newPriceOf, noCarMil, energyPerMil, AVERAGE_MIL };
