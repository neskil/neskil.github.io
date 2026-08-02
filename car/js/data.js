/* ── Reference data ──────────────────────────────────────────────────
   Every published figure the calculator leans on, plus the small pure
   functions that read them. No DOM, no state: this file is the evidence,
   not the argument. */
'use strict';

/* ── Cost components ─────────────────────────────────────────────
   Every dollar that leaves your pocket is tagged with one of these,
   so the six routes are broken down the same way and the stacked
   bars are comparable segment by segment. */
/* `short` is what fits inside a bar segment when it is wide enough to
   label directly, which is how the chart stays readable without anyone
   having to consult the legend. */
const COMPONENTS = [
    { key: 'depreciation', label: 'Depreciation & payments', short: 'Depreciation', color: 'var(--series-1)' },
    { key: 'interest',     label: 'Interest & lost return',  short: 'Interest',     color: 'var(--series-2)' },
    { key: 'fees',         label: 'Taxes, fees & penalties', short: 'Fees',         color: 'var(--series-3)' },
    { key: 'insurance',    label: 'Insurance',               short: 'Insurance',    color: 'var(--series-4)' },
    { key: 'maintenance',  label: 'Maintenance',             short: 'Upkeep',       color: 'var(--series-5)' },
    { key: 'fuel',         label: 'Fuel',                    short: 'Fuel',         color: 'var(--series-6)' }
];

/* Six routes, not four. The two subscriptions are different products with
   different prices, mileage caps and credit gates — Sixt+ says yes to a
   thin file and includes insurance, Flexcar is cheaper but wants a score
   around 650 — so averaging them into one "rent monthly" line hid the
   choice that actually matters. Daily rental is here as the anchor: it is
   what a car costs with no commitment at all, and it is the reason the
   subscriptions look like a bargain.

   The colour order is the one that passes adjacent-pair CVD separation on
   this surface; pink and green cannot sit next to each other. Dash
   patterns and direct end labels carry identity on the break-even chart
   regardless, because six lines is past what colour alone can do. */
const OPTIONS = [
    { key: 'cash',    label: 'Pay cash',      short: 'Cash',    color: 'var(--opt-cash)',    dash: '' },
    { key: 'loan',    label: 'Finance it',    short: 'Loan',    color: 'var(--opt-loan)',    dash: '7 3' },
    { key: 'lease',   label: 'Lease it',      short: 'Lease',   color: 'var(--opt-lease)',   dash: '2 3' },
    { key: 'sixt',    label: 'Sixt+',         short: 'Sixt+',   color: 'var(--opt-sixt)',    dash: '9 3 2 3' },
    { key: 'flexcar', label: 'Flexcar',       short: 'Flexcar', color: 'var(--opt-flexcar)', dash: '4 3' },
    { key: 'rental',  label: 'Daily rental',  short: 'Rental',  color: 'var(--opt-rental)',  dash: '1 3' }
];

/* A month has 30.44 days on average — but nobody pays 30.44 daily rates.
   Booking systems trip into long-hire pricing at 28 consecutive days, and
   the gap is not small: Hertz's published contract rates are $796/mo for a
   compact sedan and $1,509/mo for a mid-size SUV, against an average
   retail rate of $78/day. That is $26–50 a day against $78 — the monthly
   rate is roughly a third of the daily one. Pricing a long hire by
   multiplying the daily rate, which this page used to do, overstated it by
   two to three times. So the daily rate is kept for what it is good for —
   saying what a week costs, and why you would not do this for a year —
   and the monthly rate is what the route is actually charged at. */
const DAYS_PER_MONTH = 365 / 12;

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
   not move in step: a Toyota keeps 68% of its value at five years and a
   German saloon keeps 45%, and the German costs twice as much to run
   while doing it. Retention targets are the iSeeCars 2026 study.

   The ten-year upkeep totals used to be YourMechanic's brand figures,
   and they were far too low to put on a page that calls itself a total
   cost of ownership: $5,900 over a decade for a Toyota worked out at
   $29/mo for a new one over five years, against AAA's measured 11.04
   cents a mile — $110/mo at 12,000 miles a year — and Edmunds' TCO for a
   RAV4, which lands near $70/mo. The gap is what each source counts.
   YourMechanic prices repair labour through its own network and leaves
   out tires and scheduled service; AAA adds tires, full retail servicing
   *and* a comprehensive extended warranty, which this page should not
   carry because it prices catastrophic repair risk separately in the
   pessimistic case.

   So these are rebased to sit where Edmunds does — a new mainstream
   compact SUV at roughly $75/mo over its first five years — and the
   luxury multiple is pulled from YourMechanic's 3x down to 2.2x, which
   is closer to what RepairPal and Consumer Reports see. They are ten-year
   totals at 12,000 miles a year, spread by the age curve below. */
const BRANDS = {
    japanese: {
        label: 'Japanese', examples: 'Toyota · Honda · Mazda · Lexus',
        newPrice: 32000, maint10: 15000, insMult: 1.00, curve: 'japanese',
        warrantyBasic: 3, warrantyPower: 5,
        note: 'The reliability premium is real and it compounds: best-in-class resale and the lowest ' +
            'repair bills in the same car. You pay more up front second-hand for exactly that reason.'
    },
    korean: {
        label: 'Korean', examples: 'Hyundai · Kia · Genesis',
        newPrice: 30000, maint10: 15800, insMult: 1.00, curve: 'korean',
        warrantyBasic: 5, warrantyPower: 10,
        note: 'The best warranty in the industry — 5yr/60k basic and 10yr/100k powertrain — which takes ' +
            'most of the repair risk off a new purchase. Resale is weaker than Japanese, so buying one ' +
            'used is where the value is, though the powertrain cover may not transfer in full.'
    },
    american: {
        label: 'American', examples: 'Ford · Chevrolet · Jeep',
        newPrice: 36000, maint10: 17000, insMult: 1.05, curve: 'american',
        warrantyBasic: 3, warrantyPower: 5,
        note: 'Upkeep is close to Japanese and parts are everywhere, but resale is materially worse — ' +
            'which cuts both ways. Bad if you are buying new, good if you are buying at four years old ' +
            'and letting the first owner absorb it.'
    },
    germanLux: {
        label: 'German luxury', examples: 'BMW · Audi · Mercedes',
        newPrice: 58000, maint10: 33000, insMult: 1.35, curve: 'germanLux',
        warrantyBasic: 4, warrantyPower: 4,
        note: 'Roughly twice a Toyota to maintain over a decade, and the worst resale here. The ' +
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
   often, though both effects are milder than the price gap.

   depMult scales the depreciation curve, because shape moves resale as
   hard as it moves price and the page used to ignore that entirely. The
   iSeeCars 2026 study puts pickups at 34.2% lost over five years against
   a 41.8% average — 65.8% retained where the market keeps 58.2% — which
   is the 0.78 below, and it is the single largest body-style effect
   here: a truck is the one shape that materially defends the largest line
   on the page. Everything else sits at exactly 1.00 on purpose — iSeeCars
   publishes only EVs (57.2%), trucks (34.2%), hybrids (35.4%) and the
   41.8% average, and no segment split for sedans against SUVs, so any
   number here other than 1.00 would be invented.

   mpg is the real-world combined figure, which is what fuel should be
   priced off — the regulatory CAFE fleet average is a test-cycle number
   and roughly a third higher than anything you will see. */
const BODY_TYPES = {
    compactCar: { label: '🚗 Small car', sub: 'Civic, Corolla, Elantra',
                  priceMult: 0.74, maintMult: 0.90, insMult: 0.95, depMult: 1.00, mpg: 34 },
    sedan:      { label: '🚙 Saloon', sub: 'Camry, Accord, 3 Series',
                  priceMult: 0.88, maintMult: 0.95, insMult: 1.00, depMult: 1.00, mpg: 31 },
    suv:        { label: '🚐 Compact SUV', sub: 'RAV4, CR-V, X3 — the baseline',
                  priceMult: 1.00, maintMult: 1.00, insMult: 1.00, depMult: 1.00, mpg: 28 },
    largeSuv:   { label: '🚌 Three-row SUV', sub: 'Highlander, Pilot, X5',
                  priceMult: 1.30, maintMult: 1.15, insMult: 1.08, depMult: 1.00, mpg: 24 },
    truck:      { label: '🛻 Pickup', sub: 'F-150, Silverado, Tacoma',
                  priceMult: 1.28, maintMult: 1.20, insMult: 1.10, depMult: 0.78, mpg: 21,
                  /* No German luxury marque sells one, so the guided
                     path does not offer a price for a car you cannot
                     buy. */
                  notFor: ['germanLux'] }
};

/* What a gallon costs and what the average car does on one. AAA had the
   national average at $4.12 in late July 2026 against a $3.71 average
   across the year, so the default sits between them; it is an input
   because it moves more than any other figure on this page. */
const FUEL_DEFAULTS = { pricePerGallon: 3.90, mpg: 28, evKwhPrice: 0.15, evMiPerKwh: 3.4 };

/* Powertrain types: Petrol, Hybrid, Electric (BEV).
   BEVs carry ~50% lower maintenance (no engine/oil/transmission, low brake wear),
   18-35% higher insurance (battery replacement risk, specialist repairs),
   Georgia EV registration surcharge ($238/yr), electricity efficiency (mi/kWh),
   and $7,500 IRA clean vehicle commercial lease pass-through / residual subsidy.
   Hybrids carry ~15% lower maintenance, slightly higher insurance (+2%),
   higher mpg (e.g. 44 mpg), and $1,000 lease subsidy. */
const STATE_PRESETS = {
    ga: { name: 'Georgia', taxRate: 7.0, evFee: 238, label: 'GA TAVT 7% + $238 EV tag' },
    ca: { name: 'California', taxRate: 7.25, evFee: 108, label: 'CA Tax 7.25% + $108 EV tag' },
    tx: { name: 'Texas', taxRate: 6.25, evFee: 200, label: 'TX Tax 6.25% + $200 EV tag' },
    fl: { name: 'Florida', taxRate: 6.0, evFee: 0, label: 'FL Tax 6.0%' },
    ny: { name: 'New York', taxRate: 4.0, evFee: 0, label: 'NY Tax 4.0%' }
};

const POWERTRAIN_TYPES = {

    petrol: {
        label: '⛽ Petrol',
        maintMult: 1.00,
        insMult: 1.00,
        evRegistrationSurcharge: 0,
        defaultEfficiency: 28,
        efficiencyUnit: 'mpg',
        fuelPriceDefault: 3.90,
        fuelPriceUnit: '/gal',
        leaseResidualBonus: 0,
        depMult: 1.00,
        note: 'Standard internal combustion engine. Baseline maintenance, insurance, and pump prices.'
    },
    hybrid: {
        label: '🔋 Hybrid',
        maintMult: 0.85,
        insMult: 1.02,
        evRegistrationSurcharge: 0,
        defaultEfficiency: 44,
        efficiencyUnit: 'mpg',
        fuelPriceDefault: 3.90,
        fuelPriceUnit: '/gal',
        leaseResidualBonus: 1000,
        depMult: 0.85,
        note: 'ICE + electric motor. ~15% lower maintenance, superior fuel economy, and strong resale retention.'
    },
    ev: {
        label: '⚡ Electric',
        maintMult: 0.50,
        insMult: 1.25,
        evRegistrationSurcharge: 238,
        defaultEfficiency: 3.4,
        efficiencyUnit: 'mi/kWh',
        fuelPriceDefault: 0.15,
        fuelPriceUnit: '/kWh',
        leaseResidualBonus: 7500,
        depMult: 1.35,
        note: 'Full Battery Electric Vehicle. ~50% lower maintenance, higher insurance (+25%), GA $238 tag surcharge, $7.5k IRA lease subsidy.'
    }
};

/* Flexcar subscription mileage plans: Standard, Cruiser, Road Warrior */
const FLEXCAR_TIERS = {
    standard: { label: 'Standard 850 mi/mo',   allowance: 850,  rateOffset: 0 },
    cruiser:  { label: 'Cruiser 1,200 mi/mo',  allowance: 1200, rateOffset: 50 },
    warrior:  { label: 'Road Warrior 2,000 mi', allowance: 2000, rateOffset: 150 }
};


/* Repair spend runs at about half the lifetime average while a car is
   under warranty and climbs steeply after, reaching 2.6x past fifteen
   years. These four bands are normalised so their weighted mean across
   ten years is 1.0, which keeps the brand totals honest. */
const currentCalYear = new Date().getFullYear();
const AGE_BANDS = {
    new:    { label: 'Brand new (' + currentCalYear + ')',  buyAge: 0, modelYear: currentCalYear, insMult: 1.00, sub: 'Full factory warranty, maximum depreciation cliff' },
    three:  { label: '3 yrs old (' + (currentCalYear - 3) + ')',    buyAge: 3, modelYear: currentCalYear - 3, insMult: 0.92, sub: 'First-owner depreciation cliff already paid for' },
    six:    { label: '5–7 yrs old (' + (currentCalYear - 7) + '–' + (currentCalYear - 5) + ')',  buyAge: 6, modelYear: currentCalYear - 6, insMult: 0.80, sub: 'Factory warranty expired, routine repairs begin' },
    ten:    { label: '10+ yrs old (≤' + (currentCalYear - 10) + ')',  buyAge: 10, modelYear: currentCalYear - 10, insMult: 0.62, sub: 'Low purchase cost, owner carries all out-of-warranty upkeep' }
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
   The two genuinely uncertain inputs are what the car fetches at the end
   and what it costs you in between, so the cases move those and nothing
   else. The pessimistic case also books one major failure once the
   warranty has lapsed — the risk that never shows up in an average and is
   exactly what you carry when you buy instead of lease.

   The resale band is deliberately wide, because the US used market since
   2020 has earned it. Five-year retention was around 50% before the
   pandemic, spiked to 60%+ through the 2021-22 shortage, fell back, and
   has moved again every year since: iSeeCars puts five-year depreciation
   at 45.6% in 2025 and 41.8% in 2026, so retention swung from 54.4% to
   58.2% — a 7% relative move in the resale line in a single year, with
   nothing about the car changing. Cox has average used listings up 6%
   year on year at a three-year high. A ±10% band would have been broken
   by every one of the last six years; the asymmetry is there because
   these markets fall faster than they climb. */
const SCENARIOS = {
    optimistic:  { label: 'Optimistic',  resale: 1.15, maint: 0.70, shock: 0, wear: 0,
                   blurb: 'A tight used market when you sell, a good example, nothing unexpected, ' +
                          'and a lease handed back clean.' },
    expected:    { label: 'Expected',    resale: 1.00, maint: 1.00, shock: 0, wear: 1,
                   blurb: 'The published averages, which is what the rest of this page uses.' },
    pessimistic: { label: 'Pessimistic', resale: 0.82, maint: 1.50, shock: 45, wear: 3,
                   blurb: 'Used values soften before you sell, heavier upkeep, one major failure ' +
                          'out of warranty — and a lease that gets billed for its scuffs.' }
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
   The avail map is per route and it is the first thing that decides your
   answer: Flexcar's soft pull effectively wants a score around 650, so it
   is shut to a thin or damaged file; Sixt+ will say yes without one, which
   is exactly why it costs more; daily rental only really needs a credit
   card, which is why it is the fallback nobody wants.
   Average APRs are Experian's Q1 2026 bands. A tier also decides what
   you can actually get: a lender's decision comes before any of the
   maths on this page, and with no US file most of the routes are shut
   or repriced regardless of how much cash you have. */
const CREDIT_TIERS = {
    none: {
        label: 'No US credit history', aprNew: 11.0, aprUsed: 15.0, estimated: true, flexOffset: 120,
        avail: { cash: 'open', loan: 'gated', lease: 'gated', sixt: 'costly', flexcar: 'gated', rental: 'costly' },
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
        label: 'Rebuilding · under 600', aprNew: 16.01, aprUsed: 21.77, flexOffset: 90,
        avail: { cash: 'open', loan: 'costly', lease: 'gated', sixt: 'costly', flexcar: 'gated', rental: 'open' },
        note: 'Financing is available but brutal — 16% on new and nearly 22% on used. Flexcar requires higher credit score or substantial risk surcharge.'
    },
    nearprime: {
        label: 'Fair · 601–660', aprNew: 9.57, aprUsedEstimated: true, aprUsed: 13.5, flexOffset: 45,
        avail: { cash: 'open', loan: 'costly', lease: 'costly', sixt: 'open', flexcar: 'open', rental: 'open' },
        note: 'Approved for Flexcar with a $45/mo credit risk tier adjustment. Promotional financing on buying is out of reach.'
    },
    prime: {
        label: 'Good · 661–780', aprNew: 6.27, aprUsed: 11.4, flexOffset: 0,
        avail: { cash: 'open', loan: 'open', lease: 'open', sixt: 'open', flexcar: 'open', rental: 'open' },
        note: 'The mainstream band — standard Flexcar rate, every route is open, and promotional financing is within reach on new cars.'
    },
    superprime: {
        label: 'Excellent · 781+', aprNew: 4.66, aprUsed: 6.30, flexOffset: -30,
        avail: { cash: 'open', loan: 'open', lease: 'open', sixt: 'open', flexcar: 'open', rental: 'open' },
        note: 'Superprime credit unlocks Flexcar preferred pricing (-$30/mo discount) and 0–2.9% OEM finance rates.'
    }
};


const AVAIL_TEXT = { open: 'available', costly: 'costly', gated: 'hard to get' };
