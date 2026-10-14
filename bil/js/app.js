/* ── The page ────────────────────────────────────────────────────────
   State lives in one object; every input writes to it and every change
   re-prices and redraws everything. The inputs are generated from the
   schema below, so a field is one entry here rather than a block of HTML
   that can drift from the model's field names. Every label is an
   { en, sv } pair; the language toggle redraws the lot. */

import {
    COMPONENTS, ROUTES, POWERTRAINS, RESIDUAL_GROUPS, EXITS, LOANS, SCENARIOS,
    PRESETS, ENERGY
} from './data.js';
import {
    priceAll, horizonSeries, mileageSeries, encodeState, decodeState, fmtKr, fmtNum,
    leaseAllowance, leaseQuoteOf, subPriceOf, rentPriceOf, helInsurance, serviceYear,
    loanTypeOf
} from './model.js';
import { translator, initialLang, ROUTE_SUB } from './i18n.js';
import { openGuide } from './guide.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ROUTE_BY_KEY = Object.fromEntries(ROUTES.map(r => [r.key, r]));
const routeColor = (key) => `var(--r-${key})`;
const compColor = (i) => `var(--s${i + 1})`;

const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } }
};

let state = decodeState(location.search.slice(1));
let lang = initialLang(location.search, store.get('bil-lang'), navigator.language);
let t = translator(lang);

/* Names in the active language: Swedish product names stay Swedish in
   both, with an explanation underneath in the reader's language. */
const nameOf = (obj) => lang === 'sv' ? (obj.sv || obj.label) : obj.label;
const routeSub = (key) => ROUTE_SUB[lang][key];

/* ── Schema ────────────────────────────────────────────────────── */
const T = (en, sv) => ({ en, sv });
const opt = (obj, label) => Object.entries(obj).map(([value, v]) => ({ value, label: () => label(v) }));
const powertrainLabel = (v) => lang === 'sv' ? v.sv : `${v.label} · ${v.sv}`;
const KRMO = T('kr/mo', 'kr/mån');
const MONTHS = T('months', 'månader');

const GROUPS = [
    {
        id: 'car', sign: 'Bilen', en: 'Your car', open: true, fields: [
            { type: 'presets' },
            { key: 'price', label: T('Price you pay', 'Pris du betalar'), unit: 'kr', step: 1000, car: true },
            { key: 'age', label: T('Age when you buy it', 'Ålder när du köper den'), unit: T('years', 'år'), step: 1, max: 20, car: true, help: T('0 means new. Leasing and subscriptions always give you a new one.', '0 betyder ny. Leasing och abonnemang ger dig alltid en ny bil.') },
            { key: 'powertrain', label: T('Powertrain', 'Drivlina'), type: 'select', options: opt(POWERTRAINS, powertrainLabel), car: true },
            { key: 'co2', label: T('CO₂ (WLTP)', 'CO₂ (WLTP)'), unit: 'g/km', step: 1, car: true, showIf: s => s.powertrain !== 'el', help: T('From the registration certificate or the price list. Sets the malus.', 'Står i registreringsbeviset eller prislistan. Avgör malusen.') },
            { key: 'group', label: T('Brand (sets resale)', 'Märke (styr andrahandsvärdet)'), type: 'select', options: opt(RESIDUAL_GROUPS, v => nameOf(v)), car: true }
        ]
    },
    {
        id: 'driving', sign: 'Körning', en: 'Your driving', open: true, fields: [
            { key: 'horizon', label: T('How long you keep it', 'Hur länge du behåller den'), type: 'range', min: 6, max: 96, step: 3, show: v => t('months', v) },
            { key: 'mil', label: T('Mil a year', 'Mil per år'), type: 'range', min: 200, max: 4000, step: 50, show: v => t('milKm', v) },
            {
                key: 'congestion', label: T('Congestion charge (trängselskatt)', 'Trängselskatt'), unit: KRMO, step: 50,
                presets: [[T('None', 'Ingen'), 0], [T('Göteborg commute ≈', 'Pendla i Göteborg ≈'), 700], [T('Stockholm commute ≈', 'Pendla i Stockholm ≈'), 1200]],
                help: T('A daily commute runs to about 14 500 kr a year in Stockholm and 8 500 in Göteborg (≈). Caps: 135 and 60 kr a day.', 'Daglig pendling blir ungefär 14 500 kr per år i Stockholm och 8 500 i Göteborg (≈). Tak: 135 och 60 kr per dag.')
            },
            { key: 'parking', label: T('Parking', 'Parkering'), unit: KRMO, step: 50, help: T('A residents\' permit or a garage space, if you pay for one.', 'Boendeparkering eller garageplats, om du betalar för en.') },
            { key: 'bigCity', type: 'toggle', label: T('I live in Stockholm, Göteborg or Malmö', 'Jag bor i Stockholm, Göteborg eller Malmö'), note: T('Raises the insurance estimate', 'Höjer försäkringsuppskattningen') },
            { key: 'young', type: 'toggle', label: T('A driver under 25', 'En förare under 25'), note: T('Raises the insurance estimate', 'Höjer försäkringsuppskattningen') }
        ]
    },
    {
        id: 'money', sign: 'Pengar & kredit', en: 'Money & credit', open: true, fields: [
            { key: 'savings', label: T('Savings you could use', 'Sparpengar du kan använda'), unit: 'kr', step: 10000 },
            {
                key: 'altReturn', label: T('What the savings earn', 'Vad sparpengarna ger'), unit: T('% a year', '% per år'), step: 0.1,
                presets: [[T('Savings account', 'Sparkonto'), 2.5], [T('Mixed', 'Blandat'), 4], [T('Index fund', 'Indexfond'), 7]],
                help: T('The return cash gives up. The best variable savings rates are 2.5–2.75 % (October 2026).', 'Avkastningen kontanter går miste om. Bästa rörliga sparräntan är 2,5–2,75 % (oktober 2026).')
            },
            { key: 'loanType', label: T('Loan', 'Lån'), type: 'select', options: opt(LOANS, v => nameOf(v)) },
            { key: 'loanRate', label: T('Effective rate (effektiv ränta)', 'Effektiv ränta'), unit: '%', step: 0.05, auto: s => (loanTypeOf(s).rate * 100).toFixed(2) },
            { key: 'down', label: T('Down payment (kontantinsats)', 'Kontantinsats'), unit: '%', step: 5, help: T('A dealer loan needs 20 % by law; below that, the gap is lent unsecured with no deduction.', 'Handlarens lån kräver 20 % enligt lag; under det lånas mellanskillnaden utan säkerhet och utan ränteavdrag.') },
            { key: 'loanTerm', label: T('Loan term', 'Löptid'), unit: MONTHS, step: 12 },
            { key: 'exit', label: T('How you sell at the end', 'Hur du säljer i slutet'), type: 'select', options: opt(EXITS, v => nameOf(v)) },
            { key: 'remark', type: 'toggle', label: T('I have a payment remark', 'Jag har en betalningsanmärkning'), note: T('Betalningsanmärkning', 'Stänger lån, leasing och abonnemang') },
            { key: 'income', type: 'toggle', label: T('Steady income', 'Fast inkomst'), note: T('Fast inkomst (lenders and lessors check)', 'Långivare och leasingbolag kontrollerar') },
            { key: 'card', type: 'toggle', label: T('I have a credit card', 'Jag har kreditkort'), note: T('Rental desks want one', 'Biluthyrare kräver det') },
            { key: 'home', type: 'toggle', label: T('I own a home with room in the mortgage', 'Jag äger en bostad med utrymme i bolånet'), note: T('Allows a mortgage top-up', 'Möjliggör utökat bolån') }
        ]
    },
    {
        id: 'lease', sign: 'Privatleasing', en: 'Private lease', fields: [
            { key: 'leaseQuote', label: T('Quote at 1 000 mil a year', 'Pris vid 1 000 mil per år'), unit: KRMO, step: 10, auto: s => leaseQuoteOf({ ...s, leaseQuote: null }), help: T('Advertised prices are usually at 1 000 mil; each 500 more ≈ +349 kr. Volvo\'s fee floats with Stibor.', 'Annonserade priser gäller oftast 1 000 mil; varje 500 till ≈ +349 kr. Volvos avgift följer Stibor.') },
            { key: 'leaseMil', label: T('Mil a year you sign for', 'Mil per år i avtalet'), unit: 'mil', step: 500, auto: s => leaseAllowance({ ...s, leaseMil: null }) },
            { key: 'leaseTerm', label: T('Term', 'Avtalstid'), unit: MONTHS, step: 12 },
            { key: 'overMil', label: T('Excess mileage (övermil)', 'Övermil'), unit: 'kr/mil', step: 1, help: T('10–20 kr a mil; Volvo charges 12.', '10–20 kr per mil; Volvo tar 12.') },
            { key: 'returnDamage', label: T('Wear charged at return', 'Slitage vid återlämning'), unit: 'kr', step: 500, help: T('An expectation, not a quote. The pessimistic outlook triples it.', 'En förväntan, inte en offert. Det pessimistiska scenariot tredubblar den.') },
            { key: 'leaseService', type: 'toggle', label: T('Service included', 'Serviceavtal ingår'), note: T('Serviceavtal ingår', 'Vanligt i privatleasing') }
        ]
    },
    {
        id: 'sub', sign: 'Bilabonnemang', en: 'Car subscription', fields: [
            { key: 'subPrice', label: T('Monthly price', 'Månadspris'), unit: KRMO, step: 10, auto: s => subPriceOf({ ...s, subPrice: null }), help: T('Insurance, vehicle tax, service and tyres included. Schysst from 3 990 kr, Care by Volvo from 5 590.', 'Försäkring, fordonsskatt, service och däck ingår. Schysst från 3 990 kr, Care by Volvo från 5 590.') },
            { key: 'subMil', label: T('Mil included', 'Mil som ingår'), unit: T('mil/mo', 'mil/mån'), step: 10 },
            { key: 'subExcess', label: T('Extra mil', 'Extra mil'), unit: 'kr/mil', step: 1 },
            { key: 'subMin', label: T('Shortest stay incl. notice', 'Kortaste tid inkl. uppsägning'), unit: MONTHS, step: 1 }
        ]
    },
    {
        id: 'rental', sign: 'Långtidshyra', en: 'Monthly rental', fields: [
            { key: 'rentPrice', label: T('Monthly price', 'Månadspris'), unit: KRMO, step: 10, auto: s => rentPriceOf({ ...s, rentPrice: null }), help: T('Kinto Flex from 6 399 kr, Avis from 7 495, Volvo Car Retail from 9 990.', 'Kinto Flex från 6 399 kr, Avis från 7 495, Volvo Car Retail från 9 990.') },
            { key: 'rentMil', label: T('Mil included', 'Mil som ingår'), unit: T('mil/mo', 'mil/mån'), step: 10 },
            { key: 'rentExcess', label: T('Extra mil', 'Extra mil'), unit: 'kr/mil', step: 1 }
        ]
    },
    {
        id: 'nocar', sign: 'Utan bil', en: 'No car', fields: [
            { key: 'transit', type: 'toggle', label: T('Monthly transit pass', 'Månadskort i kollektivtrafiken'), note: T('SL 30 dagar was 1 060 kr in 2025', 'SL 30 dagar kostade 1 060 kr 2025') },
            { key: 'transitPrice', label: T('Transit pass', 'Månadskort'), unit: KRMO, step: 10, showIf: s => s.transit },
            { key: 'poolTrips', label: T('Car-sharing trips', 'Bilpoolsresor'), unit: T('a month', 'per månad'), step: 1 },
            { key: 'poolHours', label: T('Hours per trip', 'Timmar per resa'), unit: T('h', 'tim'), step: 0.5 },
            { key: 'poolKm', label: T('Distance per trip', 'Sträcka per resa'), unit: 'km', step: 5 },
            { key: 'poolHourly', label: T('Car-sharing hour', 'Bilpool per timme'), unit: T('kr/h', 'kr/tim'), step: 1, help: T('Kinto Share from 45–65 kr, M from 69 kr.', 'Kinto Share från 45–65 kr, M från 69 kr.') },
            { key: 'poolPerKm', label: T('Car-sharing distance', 'Bilpool per km'), unit: 'kr/km', step: 0.05 },
            { key: 'holidayWeeks', label: T('Holiday hire', 'Hyrbil på semestern'), unit: T('weeks/yr', 'veckor/år'), step: 1 },
            { key: 'weekPrice', label: T('A week\'s hire', 'En veckas hyra'), unit: 'kr', step: 100 }
        ]
    },
    {
        id: 'benefit', sign: 'Förmånsbil', en: 'Company car', fields: [
            { key: 'benefit', type: 'toggle', label: T('My employer offers a company car', 'Min arbetsgivare erbjuder förmånsbil'), note: T('Adds it to the comparison', 'Tar med den i jämförelsen') },
            { key: 'marginalTax', label: T('Your marginal tax', 'Din marginalskatt'), unit: '%', step: 1, showIf: s => s.benefit, presets: [[T('Municipal only', 'Bara kommunalskatt'), 32], [T('Above brytpunkt', 'Över brytpunkten'), 52]] },
            { key: 'grossDeduction', label: T('Gross salary deduction', 'Bruttolöneavdrag'), unit: KRMO, step: 100, showIf: s => s.benefit, help: T('Personalbil via bruttolöneavdrag; 0 for a plain förmånsbil.', 'Personalbil via bruttolöneavdrag; 0 för en vanlig förmånsbil.') }
        ]
    },
    {
        id: 'running', sign: 'Driftkostnader', en: 'Running costs', fields: [
            { key: 'petrol', label: T('Petrol 95', 'Bensin 95'), unit: 'kr/l', step: 0.1, showIf: s => POWERTRAINS[s.powertrain]?.fuel === 'petrol', help: T('19.40 kr today; about 22.50 once the tax cut ends on 1 December.', '19,40 kr i dag; runt 22,50 när skattesänkningen upphör 1 december.') },
            { key: 'diesel', label: T('Diesel', 'Diesel'), unit: 'kr/l', step: 0.1, showIf: s => s.powertrain === 'diesel', help: T('23.10 kr today; about 25.80 from 1 December.', '23,10 kr i dag; runt 25,80 från 1 december.') },
            {
                key: 'homeKwh', label: T('Home charging', 'Hemmaladdning'), unit: 'kr/kWh', step: 0.05, showIf: s => POWERTRAINS[s.powertrain]?.kwhPerMil > 0,
                presets: Object.entries(ENERGY.zones).map(([z, v]) => [T(z, z), v]),
                help: T('All-in: grid fee, energy tax and VAT. By elområde ≈; SE1 is the north, SE4 Skåne.', 'Allt inräknat: nätavgift, energiskatt och moms. Per elområde ≈; SE1 är norr, SE4 Skåne.')
            },
            { key: 'publicKwh', label: T('Public charging', 'Publik laddning'), unit: 'kr/kWh', step: 0.1, showIf: s => POWERTRAINS[s.powertrain]?.kwhPerMil > 0, help: T('Ionity: 5.70 in the app, 6.00 by card.', 'Ionity: 5,70 i appen, 6,00 med kort.') },
            { key: 'homeShare', label: T('Charged at home', 'Laddas hemma'), unit: '%', step: 5, showIf: s => POWERTRAINS[s.powertrain]?.kwhPerMil > 0 },
            {
                key: 'consumption', label: T('Consumption', 'Förbrukning'), step: 0.01,
                unitFn: s => s.powertrain === 'el' ? 'kWh/mil' : 'l/mil',
                auto: s => { const p = POWERTRAINS[s.powertrain]; return s.powertrain === 'el' ? p.kwhPerMil : p.litrePerMil; },
                help: T('A year\'s average including winter. For a plug-in hybrid, litres when running on fuel.', 'Årssnitt inklusive vinter. För laddhybrid: liter när den går på bränsle.')
            },
            { key: 'insurance', label: T('Full cover (helförsäkring)', 'Helförsäkring'), unit: T('kr/yr', 'kr/år'), step: 100, auto: s => Math.round(helInsurance({ ...s, insurance: null }, s.price)), help: T('Half cover is used while the three-year vagnskadegaranti runs.', 'Halvförsäkring räknas så länge den treåriga vagnskadegarantin gäller.') },
            { key: 'service', label: T('Service & repairs', 'Service & reparationer'), unit: T('kr/yr', 'kr/år'), step: 100, auto: s => Math.round(serviceYear({ ...s, service: null }, s.age)) },
            { key: 'hotel', type: 'toggle', label: T('Tyre hotel', 'Däckhotell'), note: T('Däckhotell, ≈ 1 500 kr a year', '≈ 1 500 kr per år') }
        ]
    }
];

const FIELD_BY_KEY = Object.fromEntries(GROUPS.flatMap(g => g.fields).filter(f => f.key).map(f => [f.key, f]));

/* ── Inputs ────────────────────────────────────────────────────── */
const chevron = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';

function fieldHtml(f) {
    const id = 'f-' + f.key;
    if (f.type === 'presets') {
        return `<div class="field"><span class="label">${esc(t('startFrom'))}</span><div class="chips" id="presetChips">${
            PRESETS.map(p => `<button type="button" class="chip" data-preset="${p.key}">${esc(nameOf(p))}</button>`).join('')
        }</div></div>`;
    }
    if (f.type === 'toggle') {
        const note = t.pick(f.note);
        return `<label class="toggle" data-field="${f.key}"><input type="checkbox" id="${id}" data-key="${f.key}"><span>${esc(t.pick(f.label))}${note ? `<span class="sv">${esc(note)}</span>` : ''}</span></label>`;
    }
    const help = f.help ? `<span class="help">${esc(t.pick(f.help))}</span>` : '';
    const presets = f.presets ? `<div class="chips">${f.presets.map(([l, v]) => `<button type="button" class="chip" data-set="${f.key}" data-value="${v}">${esc(t.pick(l))}</button>`).join('')}</div>` : '';
    if (f.type === 'range') {
        return `<div class="field" data-field="${f.key}"><label for="${id}"><span>${esc(t.pick(f.label))}</span><span class="range-val" id="${id}-val"></span></label>
            <input type="range" id="${id}" data-key="${f.key}" min="${f.min}" max="${f.max}" step="${f.step}">${help}</div>`;
    }
    if (f.type === 'select') {
        return `<div class="field" data-field="${f.key}"><label for="${id}"><span>${esc(t.pick(f.label))}</span></label>
            <div class="input-row"><select id="${id}" data-key="${f.key}">${f.options.map(o => `<option value="${o.value}">${esc(o.label())}</option>`).join('')}</select></div>${help}</div>`;
    }
    const auto = f.auto ? `<span class="auto-tag" id="${id}-auto" title="${esc(t('autoTitle'))}">auto</span>` : '';
    return `<div class="field" data-field="${f.key}"><label for="${id}"><span>${esc(t.pick(f.label))}</span>${auto}</label>
        <div class="input-row"><input type="number" inputmode="decimal" id="${id}" data-key="${f.key}" min="0" step="${f.step || 1}"${f.max ? ` max="${f.max}"` : ''}><span class="unit" id="${id}-unit">${esc(t.pick(f.unit) || '')}</span></div>${presets}${help}</div>`;
}

/* Rebuilt on a language change; which groups are open survives it. */
function buildInputs() {
    const open = new Set([...document.querySelectorAll('#inputs details[open]')].map(d => d.id));
    const first = !document.querySelector('#inputs details');
    $('#inputs').innerHTML = GROUPS.map(g => {
        const isOpen = first ? g.open : open.has('g-' + g.id);
        return `
        <details class="group" id="g-${g.id}"${isOpen ? ' open' : ''}>
            <summary><span class="sign">${esc(g.sign)}</span><span class="g-en i18n-en">${esc(g.en)}</span>${chevron}</summary>
            <div class="group-body">${g.fields.map(fieldHtml).join('')}</div>
        </details>`;
    }).join('');
}

function wireInputs() {
    $('#inputs').addEventListener('input', onInput);
    $('#inputs').addEventListener('change', onInput);
    $('#inputs').addEventListener('click', (e) => {
        const p = e.target.closest('[data-preset]');
        if (p) return applyPreset(p.dataset.preset);
        const s = e.target.closest('[data-set]');
        if (s) { state[s.dataset.set] = Number(s.dataset.value); update(); }
    });
}

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
    if (key === 'loanType' && e.type === 'change') state.loanRate = null;
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
        `<button type="button" class="chip" data-scenario="${k}">${esc(nameOf(s))}</button>`).join('');
}

/* ── Verdict ──────────────────────────────────────────────────── */
function plate(amount) {
    return `<span class="plate" aria-label="${esc(fmtKr(amount))} ${esc(t('krman'))}"><span class="eu" aria-hidden="true"><span class="stars"></span>S</span><span class="chars">${fmtNum(amount)}<span class="unit">kr/mån</span></span></span>`;
}

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
/* Swedish writes a decimal comma. */
const decimal = (s) => lang === 'sv' ? String(s).replace('.', ',') : String(s);

function renderVerdict(res) {
    const N = res.horizon;
    const best = res.cheapestCar;
    const el = $('#verdict');
    const nocar = res.routes.find(r => r.key === 'nocar');
    if (!best) {
        el.innerHTML = `<div class="verdict-kicker">${esc(t('verdictNoneHead'))}</div><p>${esc(t('verdictNone', nocar.perMonth))}</p>`;
        return;
    }
    const carRoutes = res.routes.filter(r => r.key !== 'nocar' && r.gate.open && !(r.key === 'benefit' && !state.benefit))
        .sort((a, b) => a.total - b.total);
    const next = carRoutes[1];
    const lines = [t('perMilLine', best.perMil, best.total, N)];
    if (next) lines.push(t('nextBest', esc(next.sv), next.perMonth - best.perMonth));
    const any = res.cheapestCarAny;
    if (any && any.key !== best.key && !any.gate.open) {
        lines.push(t('closedCheaper', esc(any.sv), best.perMonth - any.perMonth, esc(lowerFirst(t.gate(any.gate)))));
    }
    lines.push(t('noCarLine', nocar.perMonth, nocar.mil, state.mil));
    if (state.age > 0 && ['lease', 'sub', 'rental', 'benefit'].includes(best.key)) {
        lines.push(t('newCarNote', esc(lang === 'sv' ? best.sv.toLowerCase() : best.sv), state.age));
    }
    el.innerHTML = `
        <div class="verdict-kicker">${esc(t('kicker', N, state.mil))}</div>
        <div class="verdict-head">
            <h2>${esc(best.sv)}<small>${esc(routeSub(best.key))}</small></h2>
            ${plate(best.perMonth)}
        </div>
        ${lines.map(l => `<p>${l}</p>`).join('')}`;
}

/* ── Route tiles ──────────────────────────────────────────────── */
function routeNote(r) {
    const N = state.horizon;
    switch (r.key) {
        case 'cash': return t('noteCash', N, lang === 'sv' ? lowerFirst(nameOf(EXITS[state.exit])) : nameOf(EXITS[state.exit]));
        case 'loan': return t('noteLoan', r.payment, state.loanTerm, decimal((r.rate * 100).toFixed(2)), r.gapShare > 0);
        case 'lease': return t('noteLease', r.monthly, r.allowance, r.billed > N ? r.billed : 0);
        case 'sub': return t('noteSub', r.monthly, r.billed > N ? r.billed : 0);
        case 'rental': return t('noteRental', r.monthly, state.rentMil);
        case 'nocar': return t('noteNoCar', r.mil);
        case 'benefit': return t('noteBenefit', r.benefitValue);
    }
    return '';
}

function renderRoutes(res) {
    const best = res.cheapestCar;
    $('#routes').innerHTML = res.routes.filter(r => r.key !== 'benefit' || state.benefit).map(r => {
        const closed = !r.gate.open;
        const isBest = best && r.key === best.key;
        const badge = isBest ? `<span class="badge">${esc(t('badgeBest'))}</span>` : closed ? `<span class="badge">${esc(t('badgeClosed'))}</span>` : '';
        return `<article class="route${isBest ? ' is-best' : ''}${closed ? ' is-closed' : ''}" style="--swatch:${routeColor(r.key)}">
            ${badge}
            <div class="r-sv">${esc(r.sv)}</div>
            <div class="r-en">${esc(routeSub(r.key))}</div>
            <div class="r-cost">${fmtNum(r.perMonth)} <span>${esc(t('krmo'))}</span></div>
            <div class="r-mil">${fmtNum(r.perMil)} kr/mil</div>
            ${closed ? `<div class="r-reason">${esc(t.gate(r.gate))}</div>` : `<div class="r-note">${esc(routeNote(r))}</div>`}
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
    $('#componentLegend').innerHTML = COMPONENTS.map((c, i) => `<span><i style="--c:${compColor(i)}"></i>${esc(nameOf(c))}</span>`).join('');
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
            <div class="bar-label">${esc(r.sv)}<small>${esc(routeSub(r.key))}</small></div>
            <div class="bar-track">${segs}</div>
            <div class="bar-total">${fmtNum(r.perMonth)}</div>
        </div>`;
    }).join('');
    $('#breakdownSub').textContent = t('breakdownSub', N);
    const ret = decimal(state.altReturn);
    $('#breakdownCaption').innerHTML = res.cheapestCar ? t('breakdownCaption', state.mil, ret) : '';

    const head = `<tr><th>${esc(t('thRoute'))}</th>${COMPONENTS.map(c => `<th>${esc(nameOf(c))}</th>`).join('')}<th>${esc(t('thMonth'))}</th><th>${esc(t('thMil'))}</th></tr>`;
    const body = rows.map(r => `<tr><td>${esc(r.sv)}${r.gate.open ? '' : esc(t('closedTag'))}</td>${COMPONENTS.map(c => `<td>${fmtNum(r.components[c.key] / N)}</td>`).join('')}<td>${fmtNum(r.perMonth)}</td><td>${fmtNum(r.perMil)}</td></tr>`).join('');
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
        .map(([k, v]) => `<div class="t-row is-sub"><span>${esc(t.ledger(k))}</span><span>${fmtNum(v / N)}</span></div>`).join('');
    return `<div class="t-head">${esc(r.sv)}</div>
        <div class="t-row"><span><i style="--c:${compColor(ci)}"></i>${esc(nameOf(c))}</span><span>${fmtNum(r.components[c.key] / N)} ${esc(t('krmo'))}</span></div>${rows}`;
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
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => f * yMax);
    const grid = yTicks.map(v => `<line x1="${M.l}" x2="${W - M.r}" y1="${Y(v)}" y2="${Y(v)}"/>`).join('');
    const yLabels = yTicks.map(v => `<text x="${M.l - 8}" y="${Y(v) + 4}" text-anchor="end">${fmtNum(v)}</text>`).join('');
    const xLabels = opts.xTicks.map(v => `<text x="${X(v)}" y="${H - 8}" text-anchor="middle">${esc(opts.xFmt(v))}</text>`).join('');
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
            `<div class="t-row"><span><i style="--c:${routeColor(k)}"></i>${esc(ROUTE_BY_KEY[k].sv)}${opts.closed.includes(k) ? esc(t('closedTag')) : ''}</span><span>${fmtNum(d.values[k])} ${esc(t('krmo'))}</span></div>`).join('');
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
        xFmt: (v, long) => long ? t('monthsLong', v) : t('yr', v),
        marker: state.horizon, markerLabel: t('you'), yFrom: 12,
        aria: t('ariaHorizon')
    });

    const mils = [];
    for (let m = 250; m <= 4000; m += 250) mils.push(m);
    lineChart($('#milChart'), mileageSeries(state, mils), {
        keys, closed,
        xTicks: [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000],
        xFmt: (v, long) => long ? t('milLong', v) : fmtNum(v),
        marker: state.mil, markerLabel: t('you'),
        aria: t('ariaMil')
    });
}

/* ── How to decide ────────────────────────────────────────────── */
function renderGates(res) {
    const g = t('gates');
    const short = Math.max(0, state.price - state.savings);
    const lit = [state.horizon < 12, state.remark || !state.income, short > 0, state.mil > 2000];
    const html = g.map(x => typeof x === 'function' ? x(short) : x);
    const best = res.cheapestCar;
    /* Each gate is a warning triangle, numbered; your own are lit. */
    const warn = (n) => `<svg class="warn-sign" viewBox="0 0 34 30" aria-hidden="true"><path d="M17 3 L31.5 27.5 H2.5 Z" fill="#fecc02" stroke="#d4202a" stroke-width="3" stroke-linejoin="round"/><text x="17" y="24.5" text-anchor="middle" font-family="Barlow Semi Condensed, Outfit, sans-serif" font-weight="700" font-size="13" fill="#111">${n}</text></svg>`;
    $('#gates').innerHTML = html.map((h, i) => `<div class="gate${lit[i] ? ' is-lit' : ''}">${warn(i + 1)}<div>${h}</div></div>`).join('') +
        `<div class="gate is-lit is-final"><span class="info-sign" aria-hidden="true">i</span><div>${t('gateFinal', best && esc(best.sv), best && best.perMonth)}</div></div>`;
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
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { el.hidden = true; }, 2200);
}

/* The scenario, plus the language it was being read in. */
function query() {
    return [encodeState(state), 'lang=' + lang].filter(Boolean).join('&');
}

$('#shareBtn').addEventListener('click', async () => {
    const url = location.origin + location.pathname + '?' + query();
    try {
        await navigator.clipboard.writeText(url);
        toast(t('linkCopied'));
    } catch {
        prompt(t('copyThis'), url);
    }
});

let urlTimer = null;
function syncUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
        history.replaceState(null, '', location.pathname + '?' + query() + location.hash);
    }, 300);
}

/* ── Language ─────────────────────────────────────────────────────
   Fixed text carries data-i18n keys; longer prose is written twice in
   index.html as .i18n-en / .i18n-sv and the stylesheet shows one. */
function applyLang() {
    t = translator(lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    document.querySelectorAll('#langToggle [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    buildScenarios();
    buildInputs();
}

$('#langToggle').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]');
    if (!b || b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    store.set('bil-lang', lang);
    applyLang();
    update();
});

$('#scenarioChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-scenario]');
    if (b) { state.scenario = b.dataset.scenario; update(); }
});

/* ── Walkthrough ──────────────────────────────────────────────── */
$('#guideBtn').addEventListener('click', () => {
    store.set('bil-guided', '1');
    $('#guideBtn').classList.remove('is-pulsing');
    openGuide({
        state, lang,
        apply(changes) { Object.assign(state, changes); update(); },
        applyPreset,
        done() {
            const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
            $('#verdict').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        }
    });
});

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

applyLang();
wireInputs();
update();

/* A first visit with no scenario in the link: point at the walkthrough. */
if (!store.get('bil-guided') && !/(^|[?&])(?!lang=)[a-z0-9]+=/.test(location.search.slice(1))) $('#guideBtn').classList.add('is-pulsing');

/* For the screenshot recipe and the console. */
window.__bil = {
    get state() { return state; },
    set: (s) => { Object.assign(state, s); update(); },
    setLang: (l) => { lang = l; applyLang(); update(); }
};
