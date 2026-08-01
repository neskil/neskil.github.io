/* ── Shared state and small utilities ────────────────────────────────
   Loaded first. Everything here is either a piece of UI state that more
   than one module reads, or a formatter that more than one module calls.
   The modules that follow are plain scripts sharing one global scope, so
   anything declared across a file boundary lives here rather than in
   whichever file happened to need it first — otherwise load order quietly
   becomes part of the contract. */
'use strict';

/* What the lender sees, and whether the car is new to you. */
let creditTier = 'prime';
let buyingUsed = false;

/* The car being priced: marque, age band and body style. Null until the
   chips or the walkthrough set them, which is what "no profile chosen
   yet" means downstream. */
let carBrand = null, carAge = null, carBody = null;

/* Optimistic / expected / pessimistic. */
let scenarioCase = 'expected';

/* List price and out-the-door are the same number seen from either side
   of the tax line; this says which one the user typed last so the other
   can follow rather than fight it. */
let priceAnchor = 'price';

/* Break-even chart: per-month or total, plus the last rendered geometry
   so the hover crosshair can map pixels back to months. */
let curveMeasure = 'perMonth';
let curveState = null;

/* Depreciation modal: which nameplate, which rung of its trim ladder. */
let selectedModel = 'crv';
let selectedTrim = 1;
let selectedHybrid = false;

/* Bumped when input units change — a stored 10,000 from the old
   per-year mileage field would otherwise reappear in a per-month one. */
const STORAGE_KEY = 'car-lease-rent-buy-v4';

const $ = (id) => document.getElementById(id);
const num = (id) => {
    const v = parseFloat($(id).value);
    return Number.isFinite(v) ? v : 0;
};

const usd = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const usd0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
/* Rounded to the nearest thousand — a chip has room for "$24k", and a
   price estimated from a segment average does not deserve four digits
   of false precision anyway. */
const usdK = (n) => '$' + Math.round(n / 1000) + 'k';
function usdShort(n) {
    if (Math.abs(n) >= 1000) return '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    return '$' + Math.round(n);
}
