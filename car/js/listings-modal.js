/* ── Real listings explorer ──────────────────────────────────────────
   The CarMax asking prices the value model was calibrated against, and a
   scatter plot to interrogate them. */
'use strict';

/* ── Real listings ───────────────────────────────────────────────
   CarMax asking prices, transcribed as given: year (null where the
   listing did not state one), trim, price, odometer, state. This is the
   evidence the value model above was calibrated against, so it is worth
   being able to interrogate rather than take on trust. */
const LISTINGS = [
    { year: 2021, trim: 'EX', price: 23998, miles: 63000, state: 'SC' },
    { year: 2020, trim: 'EX', price: 25998, miles: 60000, state: 'IN' },
    { year: 2020, trim: 'EX', price: 26998, miles: 50000, state: 'MO' },
    { year: 2020, trim: 'EX', price: 26998, miles: 45000, state: 'TX' },
    { year: 2021, trim: 'EX', price: 26998, miles: 60000, state: 'MD' },
    { year: 2021, trim: 'EX', price: 26998, miles: 48000, state: 'GA' },
    { year: 2021, trim: 'EX', price: 25998, miles: 53000, state: 'VA' },
    { year: 2021, trim: 'EX', price: 27998, miles: 40000, state: 'PA' },
    { year: 2021, trim: 'EX', price: 25998, miles: 44000, state: 'NC' },
    { year: 2021, trim: 'EX', price: 27998, miles: 39000, state: 'IL' },
    { year: 2020, trim: 'EX', price: 24998, miles: 51000, state: 'GA' },
    { year: null, trim: 'EX', price: 21998, miles: 84000, state: 'TN' },
    { year: null, trim: 'EX', price: 23998, miles: 78000, state: 'TN' },
    { year: 2022, trim: 'EX', price: 24998, miles: 61000, state: null },
    { year: 2020, trim: 'EX-L', price: 24998, miles: 81000, state: 'VA' },
    { year: 2021, trim: 'EX-L', price: 26998, miles: 54000, state: 'TN' },
    { year: 2021, trim: 'EX-L', price: 26998, miles: 70000, state: 'MO' },
    { year: 2021, trim: 'EX-L', price: 26998, miles: 37000, state: 'VA' },
    { year: 2020, trim: 'EX-L', price: 27998, miles: 37000, state: 'TN' },
    { year: 2020, trim: 'EX-L', price: 26998, miles: 31000, state: 'GA' },
    { year: 2021, trim: 'EX-L', price: 23998, miles: 78000, state: 'TX' },
    { year: 2020, trim: 'EX-L', price: 23998, miles: 83000, state: 'MD' },
    { year: 2021, trim: 'EX-L', price: 25998, miles: 44000, state: 'FL' },
    { year: 2020, trim: 'EX-L', price: 25998, miles: 66000, state: 'TX' },
    { year: 2020, trim: 'EX-L', price: 25998, miles: 35000, state: 'GA' },
    { year: 2021, trim: 'EX-L', price: 26998, miles: 38000, state: null },
    { year: 2021, trim: 'EX-L', price: 25998, miles: 56000, state: null },
    { year: null, trim: 'EX-L', price: 26998, miles: 44000, state: 'SC' },
    { year: null, trim: 'EX-L', price: 22998, miles: 87000, state: 'TX' },
    { year: 2021, trim: 'Touring', price: 25998, miles: 75000, state: 'NC' },
    { year: 2019, trim: 'Touring', price: 21998, miles: 91000, state: 'GA' },
    { year: 2021, trim: 'Special Edition', price: 27998, miles: 12000, state: 'FL' },
    { year: 2021, trim: 'Special Edition', price: 26998, miles: 30000, state: 'NC' },
    { year: 2021, trim: 'Special Edition', price: 22998, miles: 84000, state: 'AL' },
    { year: null, trim: 'Special Edition', price: 22998, miles: 79000, state: 'NC' },
    { year: 2024, trim: 'Hybrid', price: 30998, miles: 47000, state: 'GA' },
    { year: 2024, trim: 'Hybrid', price: 30998, miles: 58000, state: 'GA' },
    { year: null, trim: 'Hybrid', price: 34998, miles: 19000, state: null }
];

/* Five categories cannot clear all-pairs colourblind separation on any
   set from this ramp, so the marker shape carries identity and colour
   only reinforces it. Legend shows both. */
const TRIM_STYLE = {
    'EX':              { color: '#3987e5', shape: 'circle' },
    'EX-L':            { color: '#d95926', shape: 'square' },
    'Touring':         { color: '#199e70', shape: 'triangle' },
    'Special Edition': { color: '#c98500', shape: 'diamond' },
    'Hybrid':          { color: '#d55181', shape: 'cross' }
};

const AXES = {
    price:        { label: 'Asking price', fmt: (v) => usd0(v), short: (v) => usdShort(v) },
    miles:        { label: 'Mileage',      fmt: (v) => Math.round(v).toLocaleString('en-US') + ' mi',
                    short: (v) => Math.round(v / 1000) + 'k' },
    year:         { label: 'Model year',   fmt: (v) => String(v), short: (v) => String(Math.round(v)) },
    milesPerYear: { label: 'Miles per year', fmt: (v) => Math.round(v).toLocaleString('en-US') + ' mi/yr',
                    short: (v) => Math.round(v / 1000) + 'k' }
};

const activeTrims = new Set(Object.keys(TRIM_STYLE));

function listingValue(row, axis) {
    if (axis === 'milesPerYear') {
        if (!row.year) return null;
        const age = Math.max(1, new Date().getFullYear() - row.year);
        return row.miles / age;
    }
    return row[axis];
}

function filteredListings(xKey, yKey) {
    const state = $('filterState').value;
    const maxMiles = num('filterMaxMiles') || Infinity;
    return LISTINGS.filter((r) => {
        if (!activeTrims.has(r.trim)) return false;
        if (state && r.state !== state) return false;
        if (r.miles > maxMiles) return false;
        return listingValue(r, xKey) !== null && listingValue(r, yKey) !== null;
    });
}

/* Ordinary least squares plus Pearson r — enough to say whether the
   cloud has a direction and how tightly it holds. */
function regression(pts) {
    const n = pts.length;
    if (n < 2) return null;
    let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
    for (const [x, y] of pts) { sx += x; sy += y; sxy += x * y; sxx += x * x; syy += y * y; }
    const denom = n * sxx - sx * sx;
    if (!denom) return null;
    const slope = (n * sxy - sx * sy) / denom;
    const intercept = (sy - slope * sx) / n;
    const rDen = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
    return { slope, intercept, r: rDen ? (n * sxy - sx * sy) / rDen : 0 };
}

function marker(shape, cx, cy, color, size) {
    const s = size || 5;
    const common = ' fill="' + color + '" stroke="var(--surface-1)" stroke-width="1.5"';
    switch (shape) {
        case 'square':
            return '<rect x="' + (cx - s) + '" y="' + (cy - s) + '" width="' + s * 2 +
                '" height="' + s * 2 + '" rx="1"' + common + '/>';
        case 'triangle':
            return '<polygon points="' + cx + ',' + (cy - s - 1) + ' ' + (cx + s + 1) + ',' + (cy + s) +
                ' ' + (cx - s - 1) + ',' + (cy + s) + '"' + common + '/>';
        case 'diamond':
            return '<polygon points="' + cx + ',' + (cy - s - 1) + ' ' + (cx + s + 1) + ',' + cy + ' ' +
                cx + ',' + (cy + s + 1) + ' ' + (cx - s - 1) + ',' + cy + '"' + common + '/>';
        case 'cross':
            return '<path d="M' + (cx - s) + ' ' + (cy - s) + 'L' + (cx + s) + ' ' + (cy + s) +
                'M' + (cx + s) + ' ' + (cy - s) + 'L' + (cx - s) + ' ' + (cy + s) +
                '" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round" fill="none"/>';
        default:
            return '<circle cx="' + cx + '" cy="' + cy + '" r="' + s + '"' + common + '/>';
    }
}


function renderDataChart() {
    const xKey = $('axisX').value, yKey = $('axisY').value;
    const rows = filteredListings(xKey, yKey);
    const ax = AXES[xKey], ay = AXES[yKey];

    const width = 760, height = 340;
    const pad = { l: 58, r: 18, t: 14, b: 40 };

    if (!rows.length) {
        $('dataChart').innerHTML = '<p class="notes">Nothing matches those filters.</p>';
        $('dataStats').innerHTML = '';
        $('dataFindings').textContent = '';
        return;
    }

    const xs = rows.map((r) => listingValue(r, xKey));
    const ys = rows.map((r) => listingValue(r, yKey));
    const padOut = (lo, hi) => {
        const span = (hi - lo) || Math.max(1, Math.abs(hi) * 0.1);
        return [lo - span * 0.08, hi + span * 0.08];
    };
    const [xMin, xMax] = padOut(Math.min(...xs), Math.max(...xs));
    const [yMin, yMax] = padOut(Math.min(...ys), Math.max(...ys));
    const f = chartFrame({ width, height, pad, xMin, xMax, yMin, yMax });

    let svg = '<svg class="linechart" viewBox="0 0 ' + width + ' ' + height +
        '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + ay.label + ' against ' +
        ax.label + ' for ' + rows.length + ' listings">';

    const yStep = niceStep(yMax - yMin, 5);
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        svg += '<line class="grid" x1="' + pad.l + '" y1="' + f.py(y).toFixed(1) + '" x2="' +
            (width - pad.r) + '" y2="' + f.py(y).toFixed(1) + '"/>';
        svg += '<text class="tick" x="' + (pad.l - 6) + '" y="' + (f.py(y) + 3).toFixed(1) +
            '" text-anchor="end">' + ay.short(y) + '</text>';
    }
    const xStep = niceStep(xMax - xMin, 5);
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
        svg += '<line class="grid" x1="' + f.px(x).toFixed(1) + '" y1="' + pad.t + '" x2="' +
            f.px(x).toFixed(1) + '" y2="' + (height - pad.b) + '"/>';
        svg += '<text class="tick" x="' + f.px(x).toFixed(1) + '" y="' + (height - pad.b + 14) +
            '" text-anchor="middle">' + ax.short(x) + '</text>';
    }
    svg += '<text class="axis-title" x="' + (width - pad.r) + '" y="' + (height - 4) +
        '" text-anchor="end">' + ax.label + ' \u2192</text>';
    svg += '<text class="axis-title" x="' + pad.l + '" y="' + (pad.t - 3) + '">\u2191 ' + ay.label + '</text>';

    /* Trend across whatever survived the filters */
    const fit = $('showFit').checked ? regression(rows.map((r) =>
        [listingValue(r, xKey), listingValue(r, yKey)])) : null;
    if (fit) {
        const y1 = fit.intercept + fit.slope * xMin, y2 = fit.intercept + fit.slope * xMax;
        svg += '<line x1="' + f.px(xMin).toFixed(1) + '" y1="' + f.py(y1).toFixed(1) + '" x2="' +
            f.px(xMax).toFixed(1) + '" y2="' + f.py(y2).toFixed(1) +
            '" stroke="rgba(248,250,252,0.55)" stroke-width="2" stroke-dasharray="6 4"/>';
    }

    /* The page's own model, drawn over the evidence it was fitted to */
    if ($('showModel').checked && xKey === 'miles' && yKey === 'price') {
        const crv = MODELS.find((m) => m.key === 'crv');
        const years = rows.map((r) => r.year).filter(Boolean).sort();
        const medianYear = years.length ? years[Math.floor(years.length / 2)] : 2021;
        const age = Math.max(0.5, new Date().getFullYear() - medianYear);
        const heldTrim = selectedTrim, heldHybrid = selectedHybrid;
        selectedTrim = 1; selectedHybrid = false;
        const msrp = modelMsrp(crv, medianYear);
        const pts = [];
        for (let mi = Math.max(0, xMin); mi <= xMax; mi += (xMax - xMin) / 40) {
            const value = msrp * modelRetained(crv, age) *
                mileagePenalty((mi / age - 12000) * age) * ASKING_MARKUP;
            pts.push((pts.length ? 'L' : 'M') + f.px(mi).toFixed(1) + ' ' + f.py(value).toFixed(1));
        }
        selectedTrim = heldTrim; selectedHybrid = heldHybrid;
        svg += '<path d="' + pts.join(' ') + '" fill="none" stroke="var(--violet)" stroke-width="2"/>';
        svg += '<text class="tick" x="' + (pad.l + 6) + '" y="' + (pad.t + 12) +
            '" fill="var(--violet)">model, ' + medianYear + ' EX</text>';
    }

    for (const r of rows) {
        const st = TRIM_STYLE[r.trim];
        const cx = f.px(listingValue(r, xKey)), cy = f.py(listingValue(r, yKey));
        svg += '<g class="pt" data-tip="' + [
            (r.year || 'year not stated') + ' CR-V ' + r.trim,
            usd0(r.price),
            Math.round(r.miles / 1000) + 'k miles',
            r.state || 'location not stated'
        ].join(' \u00b7 ') + '" style="cursor:pointer">' +
            marker(st.shape, cx.toFixed(1), cy.toFixed(1), st.color) + '</g>';
    }
    svg += '</svg>';
    $('dataChart').innerHTML = svg;

    for (const g of $('dataChart').querySelectorAll('.pt')) {
        const tip = g.dataset.tip;
        g.addEventListener('mousemove', (e) => showTooltip(e, tip));
        g.addEventListener('mouseleave', hideTooltip);
        g.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') return;
            showTooltip(e, tip); e.stopPropagation();
        });
    }

    $('dataLegend').innerHTML = Object.entries(TRIM_STYLE).map(([trim, st]) =>
        '<span class="legend-item" style="opacity:' + (activeTrims.has(trim) ? 1 : 0.35) + '">' +
        '<svg width="14" height="14" viewBox="0 0 14 14">' + marker(st.shape, 7, 7, st.color, 4.5) +
        '</svg>' + trim + '</span>').join('') +
        ($('showFit').checked ? '<span class="legend-item"><span class="legend-dash" ' +
            'style="border-top-color:rgba(248,250,252,0.55);border-top-style:dashed"></span>trend</span>' : '');

    renderDataStats(rows, xKey, yKey, fit);
    renderDataTable(rows);
}

function renderDataStats(rows, xKey, yKey, fit) {
    const prices = rows.map((r) => r.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const tiles = [
        ['Listings', String(rows.length), 'of ' + LISTINGS.length + ' in the set'],
        ['Mean price', usd0(mean), usd0(Math.min(...prices)) + ' to ' + usd0(Math.max(...prices))],
        ['Mean mileage', Math.round(rows.reduce((a, r) => a + r.miles, 0) / rows.length / 1000) + 'k',
            'across the filtered cars']
    ];

    if (fit) {
        const strength = Math.abs(fit.r) > 0.7 ? 'strong' : Math.abs(fit.r) > 0.4 ? 'moderate' : 'weak';
        tiles.push(['Correlation', fit.r.toFixed(2), strength + ', ' +
            (fit.slope < 0 ? 'negative' : 'positive')]);
        if (xKey === 'miles' && yKey === 'price') {
            tiles.push(['Per 1,000 mi', usd0(fit.slope * 1000), 'slope of the trend']);
        } else if (xKey === 'year' && yKey === 'price') {
            tiles.push(['Per model year', usd0(fit.slope), 'newer is worth this much more']);
        }
    }

    $('dataStats').innerHTML = tiles.map(([l, v, sub]) =>
        '<div class="loss-tile"><div class="tile-label">' + l + '</div><div class="tile-val">' + v +
        '</div><div class="tile-sub">' + sub + '</div></div>').join('');

    const bits = [];
    if (fit && xKey === 'miles' && yKey === 'price') {
        const perTen = Math.abs(fit.slope * 10000);
        bits.push('Across these ' + rows.length + ' cars every 10,000 miles is worth about <strong>' +
            usd0(perTen) + '</strong> — ' + (perTen / mean * 100).toFixed(1) +
            '% of the average asking price, which is where this page\u2019s 4.5% mileage rule comes from.');
    }
    if (fit && Math.abs(fit.r) < 0.4) {
        bits.push('The correlation is weak, so mileage or year is not what is setting these prices — ' +
            'trim, condition, options and how long the car has sat are doing more of the work.');
    }
    const byTrim = {};
    for (const r of rows) (byTrim[r.trim] = byTrim[r.trim] || []).push(r.price);
    const trimMeans = Object.entries(byTrim).filter(([, v]) => v.length >= 3)
        .map(([t, v]) => [t, v.reduce((a, b) => a + b, 0) / v.length])
        .sort((a, b) => b[1] - a[1]);
    if (trimMeans.length >= 2) {
        bits.push('By trim, <strong>' + trimMeans[0][0] + '</strong> averages ' + usd0(trimMeans[0][1]) +
            ' against ' + usd0(trimMeans[trimMeans.length - 1][1]) + ' for ' +
            trimMeans[trimMeans.length - 1][0] + ' — a gap of ' +
            usd0(trimMeans[0][1] - trimMeans[trimMeans.length - 1][1]) +
            ', far less than the difference between them when new.');
    }
    $('dataFindings').innerHTML = bits.join(' ');

    /* Two plausible-looking patterns in this data are artefacts, and
       saying so is more useful than quietly fitting them. */
    $('dataCaveats').innerHTML =
        '<strong>Two things this data looks like it says, but does not.</strong> ' +
        'Split the cars at 50,000 miles and the slope triples — $31 per 1,000 miles below, $97 above — ' +
        'which suggests mileage only starts to bite late. It is an age artefact: the low-mileage cars here ' +
        'are also the newer ones, and pricing age separately makes the mileage effect roughly linear again. ' +
        'Fitting the kink made predictions worse, so it is not in the model. ' +
        'Likewise the EX-L averages no more than the EX ($26,152 against $26,453 on 2020–21 cars), which ' +
        'looks like the trim premium vanishing — but the EX-L cars carry 5,000 more miles each. Control for ' +
        'that and the premium is intact. ' +
        '<em>What the data does pin down:</em> the observed slope is $67 per 1,000 miles, and the model ' +
        'reproduces it at a 4.5% mileage rate — minimising raw error would prefer 7%, but that only fits ' +
        'by over-charging mileage for errors in the age curve.';
}

function renderDataTable(rows) {
    const sorted = rows.slice().sort((a, b) => b.price - a.price);
    $('dataTableWrap').innerHTML = '<table><thead><tr>' +
        ['Year', 'Trim', 'Price', 'Miles', 'Where'].map((h) => '<th scope="col">' + h + '</th>').join('') +
        '</tr></thead><tbody>' + sorted.map((r) =>
            '<tr><td>' + (r.year || '—') + '</td><td>' + r.trim + '</td><td>' + usd0(r.price) +
            '</td><td>' + Math.round(r.miles / 1000) + 'k</td><td>' + (r.state || '—') + '</td></tr>'
        ).join('') + '</tbody></table>';
}

function buildDataModal() {
    $('filterTrims').innerHTML = Object.keys(TRIM_STYLE).map((trim) =>
        '<button class="preset-btn active" type="button" data-trim-filter="' + trim + '">' + trim +
        ' (' + LISTINGS.filter((r) => r.trim === trim).length + ')</button>').join('');
    $('filterTrims').addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn) return;
        const trim = btn.dataset.trimFilter;
        if (activeTrims.has(trim)) activeTrims.delete(trim); else activeTrims.add(trim);
        if (!activeTrims.size) activeTrims.add(trim);
        for (const b of $('filterTrims').querySelectorAll('.preset-btn')) {
            b.classList.toggle('active', activeTrims.has(b.dataset.trimFilter));
        }
        renderDataChart();
    });

    const states = [...new Set(LISTINGS.map((r) => r.state).filter(Boolean))].sort();
    $('filterState').innerHTML = '<option value="">Anywhere</option>' + states.map((st) =>
        '<option value="' + st + '">' + st + ' (' +
        LISTINGS.filter((r) => r.state === st).length + ')</option>').join('');

    for (const id of ['axisX', 'axisY', 'filterState', 'filterMaxMiles', 'showFit', 'showModel']) {
        $(id).addEventListener('input', renderDataChart);
        $(id).addEventListener('change', renderDataChart);
    }

    $('dataTableToggle').addEventListener('click', () => {
        const wrap = $('dataTableWrap');
        const shown = !wrap.hidden;
        wrap.hidden = shown;
        $('dataTableToggle').textContent = shown ? 'Show the listings' : 'Hide the listings';
        $('dataTableToggle').setAttribute('aria-expanded', String(!shown));
    });
}

function openDataModal() {
    $('dataModal').hidden = false;
    requestAnimationFrame(() => {
        $('dataBackdrop').classList.add('open');
        $('dataModal').classList.add('open');
    });
    renderDataChart();
    $('dataClose').focus();
}

function closeDataModal() {
    $('dataBackdrop').classList.remove('open');
    $('dataModal').classList.remove('open');
    setTimeout(() => { $('dataModal').hidden = true; }, 250);
}
