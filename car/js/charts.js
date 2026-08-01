/* ── Charts ──────────────────────────────────────────────────────────
   Hand-rolled SVG: a stacked bar per route, and the break-even curves
   across every horizon. Shared scale/axis plumbing lives at the top. */
'use strict';

function niceStep(range, targetTicks) {
    const raw = range / targetTicks;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const mult of [1, 2, 2.5, 5, 10]) {
        if (mag * mult >= raw) return mag * mult;
    }
    return mag * 10;
}

/* Direct end labels are how these charts stay readable without relying
   on colour, so they must never sit on top of each other: nudge them
   apart in y, keeping their order, then pull the stack back inside the
   plot if it has run off the bottom. */
function stackLabels(items, minGap, top, bottom) {
    const sorted = items.slice().sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].y - sorted[i - 1].y < minGap) sorted[i].y = sorted[i - 1].y + minGap;
    }
    const overflow = sorted.length ? sorted[sorted.length - 1].y - bottom : 0;
    if (overflow > 0) {
        for (const it of sorted) it.y = Math.max(top, it.y - overflow);
    }
    return sorted;
}

/* Minimal SVG line-chart plumbing shared by both charts: a linear
   scale pair plus axis furniture. */
function chartFrame(opts) {
    const { width, height, pad, xMin, xMax, yMin, yMax } = opts;
    const px = (x) => pad.l + (x - xMin) / (xMax - xMin || 1) * (width - pad.l - pad.r);
    const py = (y) => height - pad.b - (y - yMin) / (yMax - yMin || 1) * (height - pad.t - pad.b);
    return { px, py, plotW: width - pad.l - pad.r, plotH: height - pad.t - pad.b };
}

function renderBreakeven(v) {
    const host = $('breakevenChart');
    const maxMonths = Math.max(24, Math.min(240, Math.ceil((v.months + 24) / 12) * 12));
    const step = maxMonths > 132 ? 3 : 2;
    const points = costCurve(v, maxMonths, step);
    const measure = curveMeasure;

    const values = [];
    for (const p of points) for (const o of OPTIONS) values.push(p[o.key][measure]);
    const yMax = Math.max(...values) * 1.06;
    const yMin = Math.min(0, Math.min(...values));

    const width = 700, height = 300;
    const pad = { l: 48, r: 54, t: 12, b: 34 };
    const f = chartFrame({ width, height, pad, xMin: 6, xMax: maxMonths, yMin, yMax });

    const yStep = niceStep(yMax - yMin, 5);
    let svg = '<svg class="linechart" viewBox="0 0 ' + width + ' ' + height +
        '" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="beDesc">';

    /* Gridlines and y labels */
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
        svg += '<line class="grid" x1="' + pad.l + '" y1="' + f.py(y).toFixed(1) +
            '" x2="' + (width - pad.r) + '" y2="' + f.py(y).toFixed(1) + '"/>';
        svg += '<text class="tick" x="' + (pad.l - 6) + '" y="' + (f.py(y) + 3).toFixed(1) +
            '" text-anchor="end">' + (measure === 'total' ? usdShort(y) : usd0(y)) + '</text>';
    }

    /* x axis in years */
    for (let m = 12; m <= maxMonths; m += 12) {
        if (maxMonths > 120 && m % 24 !== 0) continue;
        svg += '<line class="grid" x1="' + f.px(m).toFixed(1) + '" y1="' + pad.t +
            '" x2="' + f.px(m).toFixed(1) + '" y2="' + (height - pad.b) + '"/>';
        svg += '<text class="tick" x="' + f.px(m).toFixed(1) + '" y="' + (height - pad.b + 14) +
            '" text-anchor="middle">' + (m / 12) + 'y</text>';
    }
    svg += '<line class="axis" x1="' + pad.l + '" y1="' + (height - pad.b) + '" x2="' +
        (width - pad.r) + '" y2="' + (height - pad.b) + '"/>';
    svg += '<text class="axis-title" x="' + (width - pad.r) + '" y="' + (height - 4) +
        '" text-anchor="end">Years owned →</text>';

    /* The horizon you picked */
    if (v.months >= 6 && v.months <= maxMonths) {
        svg += '<line class="marker-line" x1="' + f.px(v.months).toFixed(1) + '" y1="' + pad.t +
            '" x2="' + f.px(v.months).toFixed(1) + '" y2="' + (height - pad.b) + '"/>';
        svg += '<text class="tick" x="' + f.px(v.months).toFixed(1) + '" y="' + (pad.t + 9) +
            '" text-anchor="middle" fill="' + 'var(--accent)' + '">your ' + v.months + ' mo</text>';
    }

    /* Series, each with its own dash so identity survives colour loss */
    const last = points[points.length - 1];
    const labels = [];
    for (const o of OPTIONS) {
        const d = points.map((p, i) => (i ? 'L' : 'M') + f.px(p.month).toFixed(1) + ' ' +
            f.py(p[o.key][measure]).toFixed(1)).join(' ');
        svg += '<path class="serie" d="' + d + '" stroke="' + o.color + '"' +
            (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>';
        labels.push({ y: f.py(last[o.key][measure]) + 3, text: o.short, color: o.color });
    }
    for (const l of stackLabels(labels, 11, pad.t + 8, height - pad.b)) {
        svg += '<text class="serie-label" x="' + (width - pad.r + 5) + '" y="' + l.y.toFixed(1) +
            '" fill="' + l.color + '">' + l.text + '</text>';
    }

    /* Lead changes — the actual break-even points */
    const changes = findLeadChanges(points, measure);
    for (const c of changes) {
        const p = points.find((q) => q.month === c.month);
        svg += '<circle class="lead-dot" cx="' + f.px(c.month).toFixed(1) + '" cy="' +
            f.py(p[c.to][measure]).toFixed(1) + '" r="4" fill="var(--accent)"/>';
    }

    svg += '<g id="beCross" style="display:none"><line class="crosshair" y1="' + pad.t + '" y2="' +
        (height - pad.b) + '"/></g>';
    svg += '<rect id="beHit" x="' + pad.l + '" y="' + pad.t + '" width="' + f.plotW + '" height="' +
        f.plotH + '" fill="transparent" style="cursor:crosshair"/>';
    svg += '</svg>';

    host.innerHTML = svg;
    curveState = { points, measure, f, pad, width, height };
    attachCurveHover();

    $('breakevenLegend').innerHTML = OPTIONS.map((o) =>
        '<span class="legend-item"><span class="legend-dash" style="border-top-color:' + o.color +
        ';border-top-style:' + (o.dash ? 'dashed' : 'solid') + '"></span>' + o.label + '</span>').join('') +
        '<span class="legend-item"><span class="swatch" style="background:var(--accent);border-radius:50%">' +
        '</span>break-even point</span>';

    renderCrossings(changes, points, measure, v);
}

function attachCurveHover() {
    const hit = document.getElementById('beHit');
    if (!hit) return;
    const cross = document.getElementById('beCross');
    const svg = hit.ownerSVGElement;

    const move = (evt) => {
        const box = svg.getBoundingClientRect();
        const scale = curveState.width / box.width;
        const x = (evt.clientX - box.left) * scale;
        const { points, measure, f } = curveState;
        let nearest = points[0], bestDist = Infinity;
        for (const p of points) {
            const d = Math.abs(f.px(p.month) - x);
            if (d < bestDist) { bestDist = d; nearest = p; }
        }
        const cx = f.px(nearest.month);
        cross.style.display = '';
        cross.querySelector('line').setAttribute('x1', cx);
        cross.querySelector('line').setAttribute('x2', cx);
        for (const dot of cross.querySelectorAll('circle')) dot.remove();
        const ranked = OPTIONS.slice().sort((a, b) => nearest[a.key][measure] - nearest[b.key][measure]);
        for (const o of OPTIONS) {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('class', 'cross-dot');
            c.setAttribute('cx', cx);
            c.setAttribute('cy', f.py(nearest[o.key][measure]));
            c.setAttribute('r', '3.5');
            c.setAttribute('fill', o.color);
            cross.appendChild(c);
        }
        const rows = ranked.map((o, i) =>
            '<div class="tt-label"><span class="swatch" style="background:' + o.color + '"></span>' +
            o.label + (i === 0 ? ' ✓' : '') + ' <span class="tt-val">' +
            (measure === 'total' ? usd0(nearest[o.key].total) : usd0(nearest[o.key].perMonth) + '/mo') +
            '</span></div>').join('');
        showTooltip(evt, '<div class="tt-val" style="margin-bottom:3px">Keep ' + nearest.month +
            ' months (' + (nearest.month / 12).toFixed(1) + ' yr)</div>' + rows);
    };

    hit.addEventListener('mousemove', move);
    hit.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { move(e); e.stopPropagation(); } });
    hit.addEventListener('mouseleave', () => { cross.style.display = 'none'; hideTooltip(); });
}

function renderCrossings(changes, points, measure, v) {
    const labelOf = (k) => OPTIONS.find((o) => o.key === k).label.toLowerCase();
    const parts = [];

    if (!changes.length) {
        const lead = OPTIONS.slice().sort((a, b) =>
            points[0][a.key][measure] - points[0][b.key][measure])[0];
        parts.push('<strong>' + lead.label + '</strong> is cheapest at every length of ownership on these ' +
            'numbers — there is no crossover to wait for.');
    } else {
        parts.push(changes.map((c) => 'At <strong>' + c.month + ' months (' +
            (c.month / 12).toFixed(1) + ' yr)</strong> ' + labelOf(c.to) +
            ' overtakes ' + labelOf(c.from)).join('; ') + '.');
    }

    /* The gradient at your chosen horizon says whether waiting helps.
       Stepping a fixed number of points ahead is not a fixed number of
       months — the curve samples every 2 months, or every 3 once the
       horizon is long — so walk forward by however many points a year
       actually is, and say out loud how far ahead we got. */
    const here = points.reduce((a, b) =>
        Math.abs(b.month - v.months) < Math.abs(a.month - v.months) ? b : a);
    const step = points.length > 1 ? points[1].month - points[0].month : 1;
    const later = points[Math.min(points.indexOf(here) + Math.round(12 / step), points.length - 1)];
    if (later !== here) {
        const bestHere = OPTIONS.slice().sort((a, b) => here[a.key][measure] - here[b.key][measure])[0];
        const delta = later[bestHere.key].perMonth - here[bestHere.key].perMonth;
        const gap = later.month - here.month;
        parts.push('Keeping it ' + (gap === 12 ? 'a year' : gap + ' months') + ' longer than your ' +
            v.months + ' months moves ' + bestHere.label.toLowerCase() + ' by <strong>' +
            usd0(Math.abs(delta)) + '/mo ' + (delta < 0 ? 'cheaper' : 'dearer') + '</strong>.');
    }

    $('crossings').innerHTML = parts.join(' ');
    $('breakevenChart').setAttribute('aria-label',
        'Cost by length of ownership. ' + parts.join(' ').replace(/<[^>]+>/g, ''));
}

/* ── Rendering ─────────────────────────────────────────────────── */
const tooltip = $('tooltip');

function showTooltip(evt, html) {
    tooltip.innerHTML = html;
    tooltip.style.opacity = '1';
    /* Keep the bubble inside the viewport on narrow screens. */
    const half = tooltip.offsetWidth / 2;
    const x = Math.min(Math.max(evt.clientX, half + 8), window.innerWidth - half - 8);
    tooltip.style.left = x + 'px';
    tooltip.style.top = evt.clientY + 'px';
}
function hideTooltip() { tooltip.style.opacity = '0'; }

function renderChart(results, v) {
    const chart = $('chart');
    chart.innerHTML = '';

    const perMonth = OPTIONS.map((o) => results[o.key].perMonth);
    const max = Math.max(...perMonth, 1);
    const best = OPTIONS[perMonth.indexOf(Math.min(...perMonth))].key;

    for (const opt of OPTIONS) {
        const r = results[opt.key];
        const row = document.createElement('div');
        row.className = 'bar-row';

        const head = document.createElement('div');
        head.className = 'bar-head';
        head.innerHTML =
            '<span>' + opt.label + '</span>' +
            (opt.key === best ? '<span class="tag">cheapest</span>' : '') +
            '<span class="total">' + usd0(r.perMonth) + '<small>/mo</small></span>';
        row.appendChild(head);

        const track = document.createElement('div');
        track.className = 'bar-track';

        /* Bars are drawn from positive magnitudes; a negative segment
           (a car worth more at the end than it cost) shows as zero
           width and stays visible in the numbers table. */
        const scale = 100 / max;
        for (const comp of COMPONENTS) {
            const value = r.components[comp.key] / v.months;
            if (value <= 0.5) continue;
            const seg = document.createElement('div');
            seg.className = 'bar-seg';
            seg.style.background = comp.color;
            seg.style.width = (value * scale) + '%';
            const tip =
                '<div class="tt-label"><span class="swatch" style="background:' + comp.color +
                '"></span>' + comp.label + '</div>' +
                '<div class="tt-val">' + usd0(value) + '/mo · ' + usd0(r.components[comp.key]) + ' total</div>';
            seg.addEventListener('mousemove', (e) => showTooltip(e, tip));
            seg.addEventListener('mouseleave', hideTooltip);
            /* Touch: tap a segment to read it, tap anywhere to dismiss. */
            seg.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'mouse') return;
                showTooltip(e, tip);
                e.stopPropagation();
            });
            track.appendChild(seg);
        }
        row.appendChild(track);
        chart.appendChild(row);
    }

    $('chartDesc').textContent = OPTIONS
        .map((o) => o.label + ': ' + usd0(results[o.key].perMonth) + ' per month')
        .join('. ') + '.';

    const legend = $('legend');
    legend.innerHTML = COMPONENTS.map((c) =>
        '<span class="legend-item"><span class="swatch" style="background:' + c.color + '"></span>' +
        c.label + '</span>').join('');

    return best;
}
