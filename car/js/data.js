/* ── Reference data ──────────────────────────────────────────────────
   Every published figure the calculator leans on, plus the small pure
   functions that read them. No DOM, no state: this file is the evidence,
   not the argument. */
'use strict';

/* ── Cost components ─────────────────────────────────────────────
   Every dollar that leaves your pocket is tagged with one of these,
   so the four options are broken down the same way and the stacked
   bars are comparable segment by segment. */
const COMPONENTS = [
    { key: 'depreciation', label: 'Depreciation & payments', color: 'var(--series-1)' },
    { key: 'interest',     label: 'Interest & lost return',  color: 'var(--series-2)' },
    { key: 'fees',         label: 'Taxes, fees & penalties', color: 'var(--series-3)' },
    { key: 'insurance',    label: 'Insurance',               color: 'var(--series-4)' },
    { key: 'maintenance',  label: 'Maintenance',             color: 'var(--series-5)' }
];

const OPTIONS = [
    { key: 'cash',  label: 'Pay cash',     short: 'Cash',   color: 'var(--opt-cash)',  hex: '#3987e5', dash: '' },
    { key: 'loan',  label: 'Finance it',   short: 'Loan',   color: 'var(--opt-loan)',  hex: '#c98500', dash: '7 3' },
    { key: 'lease', label: 'Lease it',     short: 'Lease',  color: 'var(--opt-lease)', hex: '#199e70', dash: '2 3' },
    { key: 'rent',  label: 'Rent monthly', short: 'Rent',   color: 'var(--opt-rent)',  hex: '#d55181', dash: '9 3 2 3' }
];

/* First-year drop and the annual rate on the remainder afterwards. */
const DEPRECIATION_CURVES = {
    japanese:  { firstYear: 0.13, annual: 0.0597 },
    average:   { firstYear: 0.17, annual: 0.0849 },
    korean:    { firstYear: 0.17, annual: 0.0978 },
    american:  { firstYear: 0.20, annual: 0.1199 },
    germanLux: { firstYear: 0.24, annual: 0.1228 }
};

/* A lease keeps you inside the factory warranty, so you buy tires and
   oil changes but not a transmission. */
const LEASE_MAINTENANCE_SHARE = 0.45;

/* ── What the car actually is ────────────────────────────────────
   Marque and age drive price, upkeep and resale together, and they do
   not move in step: a Toyota keeps 68% of its value at five years and
   costs $5.4k to run for a decade, while a German saloon keeps 45% and
   costs $16k. Ten-year maintenance-and-repair totals are YourMechanic
   brand figures; the retention targets are the iSeeCars 2026 study. */
const BRANDS = {
    japanese: {
        label: 'Japanese', examples: 'Toyota · Honda · Mazda · Lexus',
        newPrice: 32000, maint10: 5900, insMult: 1.00, curve: 'japanese',
        warrantyBasic: 3, warrantyPower: 5,
        note: 'The reliability premium is real and it compounds: best-in-class resale and the lowest ' +
            'repair bills in the same car. You pay more up front second-hand for exactly that reason.'
    },
    korean: {
        label: 'Korean', examples: 'Hyundai · Kia · Genesis',
        newPrice: 30000, maint10: 6200, insMult: 1.00, curve: 'korean',
        warrantyBasic: 5, warrantyPower: 10,
        note: 'The best warranty in the industry — 5yr/60k basic and 10yr/100k powertrain — which takes ' +
            'most of the repair risk off a new purchase. Resale is weaker than Japanese, so buying one ' +
            'used is where the value is, though the powertrain cover may not transfer in full.'
    },
    american: {
        label: 'American', examples: 'Ford · Chevrolet · Jeep',
        newPrice: 36000, maint10: 6300, insMult: 1.05, curve: 'american',
        warrantyBasic: 3, warrantyPower: 5,
        note: 'Upkeep is close to Japanese and parts are everywhere, but resale is materially worse — ' +
            'which cuts both ways. Bad if you are buying new, good if you are buying at four years old ' +
            'and letting the first owner absorb it.'
    },
    germanLux: {
        label: 'German luxury', examples: 'BMW · Audi · Mercedes',
        newPrice: 58000, maint10: 16000, insMult: 1.35, curve: 'germanLux',
        warrantyBasic: 4, warrantyPower: 4,
        note: 'Roughly three times a Toyota to maintain over a decade, and the worst resale here. The ' +
            'cheap used ones are cheap for a reason: an out-of-warranty German car hands you both the ' +
            'depreciation you already ate and repair bills priced like the badge.'
    }
};

/* ── Body style ──────────────────────────────────────────────────
   The marque prices above are fleet averages, and inside one badge the
   shape is worth as much as the badge: a Civic and a Pilot are the same
   Honda. The multipliers are the ratio of real 2026 base prices within
   each brand's own range, taking a compact crossover as 1.00 because
   that is what the brand averages describe. Size follows through into
   upkeep — larger tires, bigger brakes, more fluid — and into cover,
   where a heavier vehicle does more damage and a truck is stolen more
   often, though both effects are milder than the price gap. */
const BODY_TYPES = {
    compactCar: { label: '🚗 Small car', sub: 'Civic, Corolla, Elantra',
                  priceMult: 0.74, maintMult: 0.90, insMult: 0.95 },
    sedan:      { label: '🚙 Saloon', sub: 'Camry, Accord, 3 Series',
                  priceMult: 0.88, maintMult: 0.95, insMult: 1.00 },
    suv:        { label: '🚐 Compact SUV', sub: 'RAV4, CR-V, X3 — the baseline',
                  priceMult: 1.00, maintMult: 1.00, insMult: 1.00 },
    largeSuv:   { label: '🚌 Three-row SUV', sub: 'Highlander, Pilot, X5',
                  priceMult: 1.30, maintMult: 1.15, insMult: 1.08 },
    truck:      { label: '🛻 Pickup', sub: 'F-150, Silverado, Tacoma',
                  priceMult: 1.28, maintMult: 1.20, insMult: 1.10,
                  /* No German luxury marque sells one, so the guided
                     path does not offer a price for a car you cannot
                     buy. */
                  notFor: ['germanLux'] }
};

/* Repair spend runs at about half the lifetime average while a car is
   under warranty and climbs steeply after, reaching 2.6x past fifteen
   years. These four bands are normalised so their weighted mean across
   ten years is 1.0, which keeps the brand totals honest. */
const AGE_BANDS = {
    new:    { label: 'Brand new',  buyAge: 0,  insMult: 1.00, sub: 'Full warranty, worst depreciation' },
    three:  { label: '3 years',    buyAge: 3,  insMult: 0.92, sub: 'Cliff already paid for' },
    six:    { label: '5–7 years',  buyAge: 6,  insMult: 0.80, sub: 'Out of warranty, repairs begin' },
    ten:    { label: '10+ years',  buyAge: 10, insMult: 0.62, sub: 'Cheap to buy, you own every repair' }
};

function maintMultiplierAt(age) {
    if (age < 3) return 0.45;
    if (age < 5) return 0.80;
    if (age < 8) return 1.16;
    return 1.79;
}

/* Averaged across the years you actually hold it, so a car bought at
   three and kept for six crosses out of warranty inside the estimate. */
function maintMultiplierOver(buyAge, holdYears) {
    const steps = Math.max(1, Math.round(holdYears * 4));
    let total = 0;
    for (let i = 0; i < steps; i++) total += maintMultiplierAt(buyAge + (i + 0.5) * holdYears / steps);
    return total / steps;
}

/* ── Getting rid of it ───────────────────────────────────────────
   The curves give market value. Every route out is below it, and a
   dealer is furthest below because they carry reconditioning, warranty
   risk and floor space — 15-20% under private money on a trade-in,
   14-18% on an instant offer. Trading in does carry one offset: in
   Georgia and most sales-tax states it reduces the tax base on your
   next car. */
const DISPOSAL = {
    private: { label: 'a private sale', discount: 0.12, taxCredit: false, dealer: false,
               note: 'Private sale is the most you can get, but still under the forecourt price — a ' +
                     'private seller offers no warranty, no reconditioning and no finance. The work is ' +
                     'yours too: listing, strangers, test drives, and the title transfer.' },
    instant: { label: 'an instant offer', discount: 0.26, taxCredit: false, dealer: true,
               note: 'An instant offer from CarMax or Carvana runs about 14-18% under private money — ' +
                     'the price of an appraisal in the morning and a cheque in the afternoon.' },
    tradein: { label: 'a dealer trade-in', discount: 0.27, taxCredit: true, dealer: true,
               note: 'A trade-in is the lowest gross number of the three, but at a licensed dealer the ' +
                     'trade value comes off the taxable price of the car you are buying, which claws a ' +
                     'good part of the gap back.' }
};

/* What a dealer asks is above what the car is worth — the gap is their
   reconditioning, warranty and floor space. Listings you browse sit at
   the asking end, which is why a valuation always looks low. */
const ASKING_MARKUP = 1.12;

/* What widens a dealer's spread is the odometer, not the birthday. A
   seven-year-old car with 45,000 miles is an easy retail unit and gets
   close to the standard mid-teens haircut; the same car at 130,000 is
   wholesale-or-auction material, because reconditioning cost and
   warranty risk both track miles. So the widening is priced per 10,000
   miles past 60,000, with only a small age term left for the things
   that age alone does to a car — dated infotainment, a tired interior,
   a model two generations back. A private buyer is not doing that
   arithmetic: they pay a mileage-adjusted market price, which
   mileagePenalty has already taken off the value, so their spread does
   not widen again here. Absent an odometer reading, assume the US
   average of 12,000 miles a year. */
function disposalFactor(channel, ageAtSale, milesAtSale) {
    const d = DISPOSAL[channel] || DISPOSAL.private;
    if (!d.dealer) return 1 - d.discount;
    const odo = Number.isFinite(milesAtSale) && milesAtSale > 0
        ? milesAtSale : Math.max(0, ageAtSale) * 12000;
    const widen = 0.012 * Math.max(0, odo - 60000) / 10000 +
                  0.004 * Math.max(0, ageAtSale - 5);
    return 1 - Math.min(0.40, d.discount + widen);
}

/* The same haircut expressed against private money rather than market
   value, which is the number the published spreads quote and the one
   people can sanity-check against an offer in their inbox. */
function haircutVsPrivate(channel, ageAtSale, milesAtSale) {
    const priv = disposalFactor('private', ageAtSale, milesAtSale);
    return 1 - disposalFactor(channel, ageAtSale, milesAtSale) / priv;
}

/* ── Optimistic / expected / pessimistic ────────────────────────
   The two genuinely uncertain inputs are what the car fetches at the
   end and what it costs you in between, so the cases move those and
   nothing else. The pessimistic case also books one major failure once
   the warranty has lapsed — the risk that never shows up in an average
   and is exactly what you carry when you buy instead of lease. */
const SCENARIOS = {
    optimistic:  { label: 'Optimistic',  resale: 1.10, maint: 0.70, shock: 0,
                   blurb: 'Strong resale, a good example, nothing unexpected.' },
    expected:    { label: 'Expected',    resale: 1.00, maint: 1.00, shock: 0,
                   blurb: 'The published averages, which is what the rest of this page uses.' },
    pessimistic: { label: 'Pessimistic', resale: 0.88, maint: 1.50, shock: 45,
                   blurb: 'Soft resale, heavier upkeep, and one major failure out of warranty.' }
};

/* Servicing is part calendar, part odometer. */
function mileageFactor(miles) {
    return 0.4 + 0.6 * (miles / 12000);
}

/* Buyers price the odometer as well as the birthday, but far more
   gently than the headline "5-10% per 10,000 miles" rule suggests. Real
   CR-V asking prices slope about $123 per 1,000 miles on an EX and only
   $57 on an EX-L — 2-5% per 10,000 — and because higher-mileage cars in
   any sample are also older, the mileage-only share is at the bottom of
   that. 4.5% fits the listings best once age is priced separately. */
const MILEAGE_RATE = 0.045;

function mileagePenalty(excessMiles) {
    return Math.min(1.10, Math.max(0.60, 1 - MILEAGE_RATE * excessMiles / 10000));
}

/* ── Credit tiers ────────────────────────────────────────────────
   Average APRs are Experian's Q1 2026 bands. A tier also decides what
   you can actually get: a lender's decision comes before any of the
   maths on this page, and with no US file most of the routes are shut
   or repriced regardless of how much cash you have. */
const CREDIT_TIERS = {
    none: {
        label: 'No US credit history', aprNew: 11.0, aprUsed: 15.0, estimated: true,
        avail: { cash: 'open', loan: 'gated', lease: 'gated', rent: 'costly' },
        note: 'A thin or empty US file is a lender decision, not a rate: mainstream banks decline, ' +
            'captive leases are usually out, and the cheaper subscription (Flexcar, around a 650 score) ' +
            'is shut, leaving Sixt+ at roughly $1,000/mo on a 500-mile cap as the route that will ' +
            'actually say yes. What still works — a manufacturer new-to-country programme (proof of ' +
            'employment, visa, home-country credit), an expat specialist such as International ' +
            'AutoSource, which leases new cars only, a credit union newcomer loan, or an ITIN lender. ' +
            'Expect a bigger down payment and a rate in the 10–15% region if you ' +
            'go outside those programmes. <strong>Cash is the one route nobody can decline</strong> — ' +
            'which is worth more here than the return it gives up.'
    },
    subprime: {
        label: 'Rebuilding · under 600', aprNew: 16.01, aprUsed: 21.77,
        avail: { cash: 'open', loan: 'costly', lease: 'gated', rent: 'costly' },
        note: 'Financing is available but brutal — 16% on new and nearly 22% on used. Leases almost ' +
            'always need a higher score than this. At these rates paying cash wins by a wide margin.'
    },
    nearprime: {
        label: 'Fair · 601–660', aprNew: 9.57, aprUsedEstimated: true, aprUsed: 13.5,
        avail: { cash: 'open', loan: 'costly', lease: 'costly', rent: 'open' },
        note: 'You will be approved, but well above the advertised rate, and promotional 0–2.9% offers ' +
            'are out of reach. Leases are possible with a larger drive-off payment.'
    },
    prime: {
        label: 'Good · 661–780', aprNew: 6.27, aprUsed: 11.4,
        avail: { cash: 'open', loan: 'open', lease: 'open', rent: 'open' },
        note: 'The mainstream band — every route is open and promotional financing is within reach on ' +
            'new cars. This is where the cash-versus-borrow question is genuinely close.'
    },
    superprime: {
        label: 'Excellent · 781+', aprNew: 4.66, aprUsed: 7.70,
        avail: { cash: 'open', loan: 'open', lease: 'open', rent: 'open' },
        note: 'Subsidised 0–2.9% offers are yours to take, which usually makes borrowing cheaper than ' +
            'paying cash — keep the money invested and let the captive lender fund the car.'
    }
};

const AVAIL_TEXT = { open: 'available', costly: 'costly', gated: 'hard to get' };
