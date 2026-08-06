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

/* Both charts must agree about what is being counted, so the curve reads
   the switched-on lines too. */
function curveValue(point, key, measure, months) {
    const r = point[key];
    return measure === 'total' ? activeTotal(r) : activePerMonth(r, point.month);
}

function renderBreakeven(v) {
    const host = $('breakevenChart');
    const maxMonths = Math.max(24, Math.min(240, Math.ceil((v.months + 24) / 12) * 12));
    const step = maxMonths > 132 ? 3 : 2;
    const points = costCurve(v, maxMonths, step);
    const measure = curveMeasure;

    const values = [];
    for (const p of points) for (const o of OPTIONS) values.push(curveValue(p, o.key, measure));
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
            f.py(curveValue(p, o.key, measure)).toFixed(1)).join(' ');
        svg += '<path class="serie" d="' + d + '" stroke="' + o.color + '"' +
            (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>';
        labels.push({ y: f.py(curveValue(last, o.key, measure)) + 3, text: o.short, color: o.color });
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
            f.py(curveValue(p, c.to, measure)).toFixed(1) + '" r="4" fill="var(--accent)"/>';
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
        const ranked = OPTIONS.slice().sort((a, b) =>
            curveValue(nearest, a.key, measure) - curveValue(nearest, b.key, measure));
        for (const o of OPTIONS) {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('class', 'cross-dot');
            c.setAttribute('cx', cx);
            c.setAttribute('cy', f.py(curveValue(nearest, o.key, measure)));
            c.setAttribute('r', '3.5');
            c.setAttribute('fill', o.color);
            cross.appendChild(c);
        }
        const rows = ranked.map((o, i) =>
            '<div class="tt-label"><span class="swatch" style="background:' + o.color + '"></span>' +
            o.label + (i === 0 ? ' ✓' : '') + ' <span class="tt-val">' +
            usd0(curveValue(nearest, o.key, measure)) + (measure === 'total' ? '' : '/mo') +
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
            curveValue(points[0], a.key, measure) - curveValue(points[0], b.key, measure))[0];
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
        const bestHere = OPTIONS.slice().sort((a, b) =>
            curveValue(here, a.key, measure) - curveValue(here, b.key, measure))[0];
        const delta = activePerMonth(later[bestHere.key], later.month) -
            activePerMonth(here[bestHere.key], here.month);
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

/* The same bucket means different things depending on the route, and a
   direct label has to say the route's version or it misinforms: the blue
   block is depreciation when you own the car, but it is the lease payment
   or the subscription rate when you do not, and the orange block is
   interest on a loan but forgone return on cash. The legend keeps the
   umbrella term — the segments get the specific one. */
function segmentLabel(comp, optKey) {
    if (comp.key === 'depreciation') {
        if (optKey === 'lease') return 'Lease payments';
        if (optKey === 'sixt' || optKey === 'flexcar') return 'Subscription';
        if (optKey === 'rental') return 'Rental';
        return 'Depreciation';
    }
    if (comp.key === 'interest') return optKey === 'loan' ? 'Interest' : 'Lost return';
    return comp.short;
}

function renderChart(results, v) {
    const chart = $('chart');
    chart.innerHTML = '';

    const perMonth = OPTIONS.map((o) => activePerMonth(results[o.key], v.months));
    /* Daily rental runs about four times everything else, and on a shared
       scale it flattens the five routes anyone is actually choosing
       between — segments stop being labellable and the differences that
       matter stop being visible. So a route that runs away from the field
       is drawn to the edge with a break marker and its real number in the
       head, and the scale belongs to the rest. The test is relative, not a
       hard-coded exception: only a value more than double the next one
       down gets cut, which is the point where one bar is no longer
       comparable with the others anyway. */
    const sorted = perMonth.slice().sort((a, b) => b - a);
    const runaway = sorted.length > 1 && sorted[0] > sorted[1] * 2;
    const max = Math.max(runaway ? sorted[1] * 1.05 : sorted[0], 1);
    /* "Cheapest" means cheapest of the ones you can actually have. A route
       a lender has already declined is still drawn — knowing what it would
       have cost is the point of showing it — but dimmed, labelled with the
       reason, and out of the running. */
    const best = cheapestAvailable(results, v).key;

    /* Sort routes from cheapest to most expensive by active monthly cost. */
    const sortedOptions = OPTIONS.slice().sort((a, b) =>
        activePerMonth(results[a.key], v.months) - activePerMonth(results[b.key], v.months)
    );

    for (const opt of sortedOptions) {
        const r = results[opt.key];
        const row = document.createElement('div');
        row.className = 'bar-row';

        const avail = routeAvailability(opt.key, v, results);
        if (avail.state !== 'open') row.classList.add('is-' + avail.state);

        const head = document.createElement('div');
        head.className = 'bar-head';
        head.innerHTML =
            '<span>' + opt.label + '</span>' +
            (opt.key === best ? '<span class="tag">cheapest you can get</span>' : '') +
            (avail.state === 'gated' ? '<span class="tag gate">not open to you</span>' : '') +
            '<span class="total">' + usd0(activePerMonth(r, v.months)) + '<small>/mo</small></span>';
        row.appendChild(head);

        /* Which car this row is actually pricing — the assumption most
           worth stating, right where the number is read. */
        const veh = routeVehicle(opt.key, v);
        const sub = document.createElement('div');
        sub.className = 'bar-sub' + (veh.matches ? '' : ' quoted');
        sub.textContent = veh.text + (avail.reason ? ' — ' + avail.reason : '');
        row.appendChild(sub);

        const track = document.createElement('div');
        track.className = 'bar-track';
        const offScale = r.perMonth > max;
        if (offScale) track.classList.add('off-scale');

        /* Bars are drawn from positive magnitudes; a negative segment
           (a car worth more at the end than it cost) shows as zero
           width and stays visible in the numbers table. */
        const scale = 100 / max;
        for (const comp of COMPONENTS) {
            if (!activeComponents.has(comp.key)) continue;
            const value = r.components[comp.key] / v.months;
            if (value <= 0.5) continue;
            const seg = document.createElement('div');
            seg.className = 'bar-seg';
            seg.style.background = comp.color;
            const pct = value * scale;
            seg.style.width = pct + '%';

            /* Label the segment in place when there is room for the word.
               Dark ink, not white: near-black clears 4.5:1 on all six
               fills where white manages only 3.1–4.2. A share of the
               track is only a first guess at whether the word fits — the
               same 13% is 90px on a desktop column and 40px on a phone,
               and it collapsed further once daily rental joined the scale
               at four times everything else — so the gate here is only a
               cheap reject and the real check is measured in pixels once
               the bars are in the document. */
            if (pct >= 4) {
                seg.textContent = segmentLabel(comp, opt.key);
                seg.classList.add('labelled');
            }

            /* What is actually inside this block, itemised. The ledger
               tags every flow with what it is, so the answer to "what
               counts as a fee here?" is the sum of its parts rather than
               a category name. */
            const parts = (r.detail && r.detail[comp.key]) || {};
            const lines = Object.entries(parts)
                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                .map(([label, amt]) =>
                    '<div class="tt-part"><span>' + label + '</span><span>' +
                    usd0(amt / v.months) + '/mo</span></div>').join('');
            const tip =
                '<div class="tt-label"><span class="swatch" style="background:' + comp.color +
                '"></span>' + comp.label + '</div>' +
                '<div class="tt-val">' + usd0(value) + '/mo · ' + usd0(r.components[comp.key]) +
                ' over ' + v.months + ' mo</div>' +
                (lines ? '<div class="tt-parts">' + lines + '</div>' : '');
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
        if (offScale) {
            const mark = document.createElement('div');
            mark.className = 'bar-offscale';
            mark.textContent = 'off the scale — ' + usd0(r.perMonth) + '/mo, ' +
                (r.perMonth / max).toFixed(1) + '× the widest bar shown';
            row.appendChild(mark);
        }
        chart.appendChild(row);
    }

    /* Now that the bars have real widths, drop any label that did not
       actually fit rather than showing a clipped half-word. */
    for (const seg of chart.querySelectorAll('.bar-seg.labelled')) {
        if (seg.scrollWidth > seg.clientWidth + 1) {
            seg.textContent = '';
            seg.classList.remove('labelled');
        }
    }

    /* One shared scale across the six bars, so their lengths are
       comparable — say what it is rather than leaving it implied. */
    const axis = document.createElement('div');
    axis.className = 'bar-axis';
    axis.innerHTML = '<span>$0</span><span>' + usd0(max / 2) + '/mo</span><span>' +
        usd0(max) + (runaway ? '+' : '') + '/mo</span>';
    chart.appendChild(axis);

    $('chartDesc').textContent = sortedOptions
        .map((o) => o.label + ': ' + usd0(results[o.key].perMonth) + ' per month')
        .join('. ') + '.';

    const legend = $('legend');
    legend.innerHTML = COMPONENTS.map((c) => {
        const on = activeComponents.has(c.key);
        return '<button type="button" class="legend-item legend-toggle' + (on ? '' : ' off') +
            '" data-comp="' + c.key + '" aria-pressed="' + on + '">' +
            '<span class="swatch" style="background:' + c.color + '"></span>' + c.label + '</button>';
    }).join('') +
        (allComponentsOn()
            ? '<span class="legend-hint">tap a line to take it out of the comparison</span>'
            : '<button type="button" class="legend-hint reset" id="legendReset">show everything again</button>');

    return best;
}
