/* ── Reference data ──────────────────────────────────────────────────
   Every number the calculator leans on, in one place, each with where it
   came from. No DOM and no logic beyond lookups: model.js is the argument,
   this file is the evidence. Figures are as of October 2026; when one
   changes, change it here and nowhere else.

   A figure marked ≈ is an estimate rather than a published number — a
   midpoint of a published range, or a placeholder until a better source
   turns up. README.md lists which is which. */

export const AS_OF = '2026-10-14';

/* ── Cost components ─────────────────────────────────────────────
   Every krona that leaves your pocket is tagged with one of these, so
   all routes break down the same way and the stacked bars compare
   segment by segment. Colours are the validated dark-mode categorical
   order (dataviz reference palette), assigned in fixed order. */
export const COMPONENTS = [
    { key: 'value',     label: 'Value lost & payments', sv: 'Värdeminskning & avgifter', short: 'Value' },
    { key: 'interest',  label: 'Interest & lost return', sv: 'Ränta & utebliven avkastning', short: 'Interest' },
    { key: 'tax',       label: 'Taxes & fees',           sv: 'Skatt & avgifter', short: 'Tax' },
    { key: 'insurance', label: 'Insurance',              sv: 'Försäkring', short: 'Insurance' },
    { key: 'upkeep',    label: 'Service & tyres',        sv: 'Service & däck', short: 'Upkeep' },
    { key: 'energy',    label: 'Fuel & charging',        sv: 'Drivmedel & el', short: 'Energy' },
    { key: 'city',      label: 'Parking & congestion',   sv: 'Parkering & trängselskatt', short: 'City' }
];

/* The six ways to get the keys, plus a company car for the people whose
   employer offers one. Order is the colour order on every chart. */
export const ROUTES = [
    { key: 'cash',    label: 'Buy with cash',      sv: 'Kontantköp',     dash: '' },
    { key: 'loan',    label: 'Car loan',           sv: 'Billån',         dash: '7 3' },
    { key: 'lease',   label: 'Private lease',      sv: 'Privatleasing',  dash: '2 3' },
    { key: 'sub',     label: 'Car subscription',   sv: 'Bilabonnemang',  dash: '9 3 2 3' },
    { key: 'rental',  label: 'Monthly rental',     sv: 'Långtidshyra',   dash: '4 3' },
    { key: 'nocar',   label: 'No car',             sv: 'Utan bil',       dash: '1 3' },
    { key: 'benefit', label: 'Company car',        sv: 'Förmånsbil',     dash: '12 4' }
];

/* ── Fordonsskatt (vehicle tax) ──────────────────────────────────
   Transportstyrelsen, cars first registered from 1 June 2022:
   360 kr a year, plus during the first three years ("malus") 107 kr per
   gram of CO2/km between 75 and 125 g and 132 kr per gram above 125 g.
   From year four: 22 kr per gram above 111 g. Diesel adds a fuel
   supplement of 13.52 kr per gram on the whole emission and a 250 kr
   environment supplement. An electric car pays the 360 kr only.
   Vägtrafikregisteravgift: 74 kr per vehicle and year from 1 January
   2026 (up 9 % from 69 kr; Borskollen citing Carup). */
export const VEHICLE_TAX = {
    base: 360,
    malusYears: 3,
    malusLowFrom: 75,
    malusLowRate: 107,
    malusHighFrom: 125,
    malusHighRate: 132,
    afterFrom: 111,
    afterRate: 22,
    dieselPerGram: 13.52,
    dieselEnvironment: 250,
    registerFee: 74
};

/* ── Ränteavdrag (interest deduction) ────────────────────────────
   30 % of interest up to 100 000 kr a year, 21 % above. From 1 January
   2026 only loans *with security* qualify: the deduction for unsecured
   loans (privatlån, blancolån, card credit) was halved for 2025 and
   removed for 2026. A car loan with the car as security still counts; a
   "car loan" that is really an unsecured private loan does not. The cap
   is per person and shared with any mortgage. */
export const INTEREST_DEDUCTION = { rate: 0.30, cap: 100000, rateAbove: 0.21 };

/* ── Förmånsvärde (company-car benefit), income year 2026 ────────
   Skatteverket: 0.29 × prisbasbelopp + nybilspris × (0.70 × statslåneränta
   + 1 %) + nybilspris × 13 % + the car's vehicle tax. Prisbasbelopp
   59 200 kr; statslåneränta 2.55 % (30 Nov 2025). The new-car price is
   reduced by 350 000 kr for an electric car and 140 000 kr for a plug-in
   hybrid, but by no more than half the price. Skatteverket's own check:
   322 000 kr with 4 050 kr vehicle tax gives 72 045 kr. */
export const BENEFIT = {
    prisbasbelopp: 59200,
    fixedShare: 0.29,
    slr: 0.0255,
    slrShare: 0.70,
    slrAdd: 0.01,
    priceShare: 0.13,
    reduction: { el: 350000, laddhybrid: 140000 },
    reductionCap: 0.5,
    /* Employer social fees: a bruttolöneavdrag is sized so the employer
       comes out even, so it is the employer's cost ÷ 1.3142. */
    socialFees: 0.3142
};

/* ── Energy prices ───────────────────────────────────────────────
   Pump prices on 13 October 2026 were about 19.40 kr/l for 95 and
   23.10 kr/l for diesel, under a temporary carbon-tax cut that ends
   30 November; Carup puts the 1 December prices at about 22.54 and
   25.79 kr/l. A car is kept for years, not weeks, so the defaults are the
   post-December prices.
   Home charging about 1.80 kr/kWh on a variable contract including grid
   fee, energy tax and VAT (2026). Ionity fast charging 6.00 kr/kWh by card,
   5.70 in the app; other operators roughly 4–7; DC fast charging up to
   about 6.80. The default is Ionity's app price. */
export const ENERGY = {
    petrol: 22.50,
    diesel: 25.80,
    petrolToday: 19.40,
    dieselToday: 23.10,
    homeKwh: 1.80,
    publicKwh: 5.70,
    homeShare: 0.80,
    /* Home charging by elområde, all-in (≈, from a 2026 deep-research
       summary): the north is cheapest, Skåne dearest. */
    zones: { SE1: 1.55, SE2: 1.60, SE3: 2.25, SE4: 2.65 }
};

/* ── Powertrains ─────────────────────────────────────────────────
   Consumption per Swedish mil (10 km), a year's average including winter.
   An EV's 1.9 kWh/mil includes charging losses and the cold-weather hit
   (≈ 17 kWh/100 km summer). Service is a year's scheduled service on a
   car still under warranty (≈, see README). CO2 is a default for the
   field, not a claim about any model. */
export const POWERTRAINS = {
    el:         { label: 'Electric',        sv: 'Elbil',       kwhPerMil: 1.9, litrePerMil: 0,    fuel: null,     electricShare: 1,   service: 2000, co2: 0 },
    laddhybrid: { label: 'Plug-in hybrid',  sv: 'Laddhybrid',  kwhPerMil: 2.0, litrePerMil: 0.60, fuel: 'petrol', electricShare: 0.5, service: 4000, co2: 30 },
    hybrid:     { label: 'Hybrid',          sv: 'Elhybrid',    kwhPerMil: 0,   litrePerMil: 0.45, fuel: 'petrol', electricShare: 0,   service: 3500, co2: 105 },
    bensin:     { label: 'Petrol',          sv: 'Bensin',      kwhPerMil: 0,   litrePerMil: 0.65, fuel: 'petrol', electricShare: 0,   service: 3800, co2: 140 },
    diesel:     { label: 'Diesel',          sv: 'Diesel',      kwhPerMil: 0,   litrePerMil: 0.55, fuel: 'diesel', electricShare: 0,   service: 4200, co2: 135 }
};

/* ── Resale (värdeminskning) ─────────────────────────────────────
   Share of the new price left after one, three and five years. Swedish
   sources disagree by more than the brands differ, so these are the
   midpoints of the published ranges: Toyota 58–68 % at three years,
   Volvo 50–62 %, BMW/Mercedes 46–60 %, Kia/Hyundai 47–54 %, Tesla 52–62 %
   (bilmarknadsdata.se, minbilkoll.se, 2026); a second 2026 summary gives
   Toyota/Kia 55–62 %, Volvo/VW 52–57 %, German premium 48–54 % and BEVs
   42–51 %, so where the two disagree the figure sits between them. One
   model year older is
   9–14 % cheaper on the used market (minbilkostnad.se). After year five
   the yearly loss slows to 70 % of the year-3-to-5 pace. An electric car
   from a brand that mostly sells combustion cars loses 12 % more (VW ID.4
   and Polestar 2 lost about 40 % in three model years against about 31 %
   for an XC60 hybrid). */
export const RESIDUAL_GROUPS = {
    toyota:  { label: 'Toyota, Lexus',              r1: 0.85, r3: 0.60, r5: 0.48 },
    volvo:   { label: 'Volvo, VW, Škoda, Cupra',    r1: 0.83, r3: 0.55, r5: 0.43 },
    premium: { label: 'BMW, Mercedes, Audi',        r1: 0.81, r3: 0.51, r5: 0.39 },
    korean:  { label: 'Kia, Hyundai',               r1: 0.82, r3: 0.53, r5: 0.41 },
    evbrand: { label: 'Tesla, Polestar',            r1: 0.79, r3: 0.52, r5: 0.39 },
    other:   { label: 'Other brands',               r1: 0.81, r3: 0.52, r5: 0.40 }
};
export const LATE_PHASE = 0.7;
export const EV_LOSS_MULT = 1.12;
export const AVERAGE_MIL = 1250;            // Trafikanalys: 1 243 mil per car in 2025
export const VALUE_PER_1000_MIL = 0.02;     // ≈ share of value lost per 1 000 mil above average

/* How you sell at the end, as a share of what a private buyer would pay,
   plus a fixed fee. ≈: from a 2026 deep-research summary (private 1.00
   with a 495 kr ad, KVD 0.92, direct buyers such as Riddermark or Carla
   0.87, dealer trade-in 0.84); no seller publishes these. There is no
   US-style sales-tax credit on a trade-in, so it is simply a sale. */
export const EXITS = {
    privat:    { label: 'Private sale (Blocket, Wayke)', sv: 'Privat',            haircut: 0.00, fee: 495 },
    auktion:   { label: 'Auction (KVD)',                 sv: 'Auktion',           haircut: 0.08, fee: 0 },
    uppkopare: { label: 'Direct buyer (Riddermark, Carla)', sv: 'Direktuppköpare', haircut: 0.13, fee: 0 },
    inbyte:    { label: 'Dealer trade-in',               sv: 'Inbyte',            haircut: 0.16, fee: 0 }
};

/* ── Insurance ───────────────────────────────────────────────────
   Hedvig's 2026 average for helförsäkring is 584 kr/mo (about 7 000 kr a
   year) over 14 518 customers; comparison sites give 6 000–10 000 kr.
   Halvförsäkring ≈ 3 500 kr. A new car from an authorised dealer carries
   a three-year vagnskadegaranti (own-damage warranty), during which
   halvförsäkring is enough; from year four you need helförsäkring.
   The per-value slope is ≈, fitted so an average used car lands near
   7 000 kr and a new mid-size one near 8 000. A second 2026 summary puts
   full cover at about twice half cover, a driver under 25 at ×1.45 and a
   city address at ×1.20. */
export const INSURANCE = {
    helBase: 3000,
    helPerKr: 0.012,
    halvShare: 0.5,
    garantiMonths: 36,
    youngMult: 1.45,
    cityMult: 1.20
};

/* ── Service, tyres, inspection ──────────────────────────────────
   Service grows with age once the warranty runs out (≈ multipliers).
   Tyres: one summer and one winter set, each lasting about 6 000 mil;
   a swap twice a year at about 450 kr (150–250 kr per tyre mounted plus
   balancing), däckhotell 800–1 500 kr per season if you use one.
   Winter tyres are compulsory 1 December – 31 March in winter conditions
   (2 000 kr fine since February 2025); studs allowed 1 October – 15 April.
   Besiktning: first within 36 months, then 24, then every 14 months;
   395–525 kr at the four big chains in 2026. */
export const UPKEEP = {
    ageMult: [ [3, 1.0], [6, 1.6], [10, 2.3], [Infinity, 3.0] ],
    tyreSet: { small: 7000, mid: 9000, large: 12000 },
    rimSet:  { small: 7000, mid: 10000, large: 15000 },   // ≈ rims alone; a complete set with tyres runs 15 500–34 000
    rimResale: 0.4,
    tyreLifeMil: 6000,
    evTyreWear: 1.15,
    swap: 450,
    hotelYear: 1200,
    inspection: 450,
    inspectAt: [36, 24, 14]
};

/* Price tier by new price, for tyres and service. */
export function sizeTier(newPrice) {
    if (newPrice < 350000) return 'small';
    if (newPrice < 550000) return 'mid';
    return 'large';
}
export const SIZE_MULT = { small: 0.85, mid: 1.0, large: 1.25 };

/* ── Loans ───────────────────────────────────────────────────────
   Billån through the dealer is a kreditköp: konsumentkreditlagen 26 §
   requires at least 20 % cash down, and the car is the security, so the
   interest is deductible. Rates in 2026: Santander 5.45–9.95 % nominal,
   Volvofinans typically 4–8 % on new cars, Ikano 6.49–20.81 % effective.
   Fees: Volvofinans charges none; elsewhere uppläggning 495–695 kr and
   avi about 20 kr/mo by e-invoice, 45–60 on paper. Volvofinans lends up
   to 80 % for at most 96 months. Put less than 20 % down on a dealer
   loan and the gap is financed as an unsecured loan with no deduction.
   A private loan has no down-payment rule and, from 2026, no deduction.
   A mortgage top-up is the cheapest money there is if you own a home with
   room in the mortgage; Riksbanken's policy rate is 1.75 % (Sept 2026). */
export const LOANS = {
    billan:    { label: 'Car loan via the dealer', sv: 'Billån (bilen som säkerhet)', rate: 0.065, minDown: 0.20, deductible: true,  setup: 595, monthlyFee: 29, needsHome: false },
    privatlan: { label: 'Unsecured private loan',  sv: 'Privatlån utan säkerhet',     rate: 0.095, minDown: 0,    deductible: false, setup: 0,   monthlyFee: 29, needsHome: false },
    bolan:     { label: 'Mortgage top-up',         sv: 'Utökat bolån',                rate: 0.030, minDown: 0,    deductible: true,  setup: 0,   monthlyFee: 0,  needsHome: true }
};

/* ── Privatleasing ───────────────────────────────────────────────
   36 months, no down payment, service usually included; insurance,
   vehicle tax and winter wheels on top. A Volvo EX30 leased for
   3 495–3 790 kr/mo on 36 months and 1 000 mil a year in autumn 2026
   (about 0.85 % of its 429 000 kr list price a month); an XC40 B3 4 995,
   an EX40 5 195. Each extra 500 mil a year adds about 300 kr/mo.
   Excess mileage 10–20 kr/mil (Volvo 12). Abnormal wear is charged at
   return. Many contracts float with the lessor's funding rate. */
export const LEASE = {
    shareOfPrice: 0.0088,
    baseMil: 1000,
    stepMil: 500,
    stepPrice: 300,
    overMil: 12,
    setup: 595,
    returnDamage: 4500,   // ≈ expected per return; bills of 5 000–25 000 kr are common
    term: 36
};

/* ── Bilabonnemang ───────────────────────────────────────────────
   One price including insurance, vehicle tax, service and tyres, and a
   short notice period. Kinto Flex from 5 999 kr/mo with vehicle tax,
   inspection, service and 300 mil a month, month to month; Care by Volvo
   advertised from 5 590–5 990 kr/mo, cancellable after six months on
   three months' notice. ≈ 1.4 % of list price a month. */
export const SUBSCRIPTION = {
    shareOfPrice: 0.014,
    floor: 4990,
    milPerMonth: 150,
    excess: 25,           // ≈ kr/mil
    minMonths: 9
};

/* ── Långtidshyra (monthly rental) ───────────────────────────────
   Avis Minilease from 7 495 kr/mo for a Peugeot 2008 or similar, basic
   insurance with a 9 500 kr excess. Monthly hires usually include
   1 500–4 000 km a month, excess 1–6.50 kr/km. */
export const RENTAL = {
    monthly: { small: 7495, mid: 8995, large: 11995 },   // small sourced, mid/large ≈
    milPerMonth: 250,
    excess: 30,
    deductible: 9500
};

/* ── Utan bil (no car) ───────────────────────────────────────────
   SL's 30-day ticket was 1 060 kr in 2025 (half price on 28–31-day
   tickets from July to December 2026 with state support). Car sharing:
   Kinto Share from about 45–65 kr/h or 445 kr/day, 2.25 kr/km with fuel;
   M from 69 kr/h plus 2–4 kr/km. A week's car hire for the summer
   holiday ≈ 3 500 kr. */
export const NOCAR = {
    transit: 1060,
    hourly: 55,
    perKm: 2.5,
    trips: 4,
    hours: 3,
    km: 40,
    weeks: 2,
    weekPrice: 3500
};

/* ── Scenarios ───────────────────────────────────────────────────
   Optimistic and pessimistic move the things nobody can promise: how
   fast the car loses value, what it costs to keep, fuel, and the floating
   rate in loans and leases. */
export const SCENARIOS = {
    good:     { label: 'Optimistic', sv: 'Optimistiskt', loss: 0.85, upkeep: 0.85, energy: 0.90, rate: -0.005, damage: 0 },
    expected: { label: 'Expected',   sv: 'Väntat',       loss: 1.00, upkeep: 1.00, energy: 1.00, rate: 0,      damage: 1 },
    bad:      { label: 'Pessimistic', sv: 'Pessimistiskt', loss: 1.20, upkeep: 1.30, energy: 1.15, rate: 0.01, damage: 3 }
};

/* ── Cars to start from ──────────────────────────────────────────
   Four of the best sellers of autumn 2026 at their published "from"
   prices, a Golf and a Tiguan from a 2026 deep-research summary (with
   their WLTP CO2 and consumption), and a generic used car. Leasing quotes
   are filled in only where one was found. */
export const PRESETS = [
    { key: 'ex30',  label: 'Volvo EX30',            price: 429000, age: 0, powertrain: 'el',         co2: 0,   group: 'volvo',   leaseQuote: 3690 },
    { key: 'ev3',   label: 'Kia EV3',               price: 429900, age: 0, powertrain: 'el',         co2: 0,   group: 'korean' },
    { key: 'my',    label: 'Tesla Model Y',         price: 499990, age: 0, powertrain: 'el',         co2: 0,   group: 'evbrand' },
    { key: 'xc60',  label: 'Volvo XC60 plug-in',    price: 569900, age: 0, powertrain: 'laddhybrid', co2: 23,  group: 'volvo' },
    { key: 'golf',  label: 'VW Golf eTSI',          price: 349900, age: 0, powertrain: 'bensin',     co2: 124, group: 'volvo',   consumption: 0.54 },
    { key: 'tiguan', label: 'VW Tiguan TDI',        price: 465000, age: 0, powertrain: 'diesel',     co2: 164, group: 'volvo',   consumption: 0.63 },
    { key: 'used',  label: 'Used petrol, 5 years',  price: 200000, age: 5, powertrain: 'bensin',     co2: 140, group: 'volvo' }
];

/* ── The page's starting point ───────────────────────────────────── */
export const DEFAULTS = {
    preset: 'ex30',
    price: 429000,
    age: 0,
    powertrain: 'el',
    co2: 0,
    group: 'volvo',
    horizon: 36,
    mil: 1250,
    scenario: 'expected',

    petrol: ENERGY.petrol,
    diesel: ENERGY.diesel,
    homeKwh: ENERGY.homeKwh,
    publicKwh: ENERGY.publicKwh,
    homeShare: 80,
    consumption: null,      // null = the powertrain's default
    insurance: null,        // null = estimated (helförsäkring kr/yr)
    service: null,          // null = estimated (kr/yr)
    hotel: false,
    congestion: 0,
    parking: 0,
    young: false,
    bigCity: false,

    savings: 500000,
    altReturn: 2.0,
    loanType: 'billan',
    loanRate: null,         // null = the loan type's default
    down: 20,
    loanTerm: 60,
    exit: 'inbyte',
    remark: false,
    income: true,
    card: true,
    home: false,

    leaseQuote: 3690,
    leaseMil: null,         // null = the next step up from your driving
    leaseTerm: 36,
    overMil: LEASE.overMil,
    leaseService: true,
    returnDamage: LEASE.returnDamage,

    subPrice: null,
    subMil: SUBSCRIPTION.milPerMonth,
    subExcess: SUBSCRIPTION.excess,
    subMin: SUBSCRIPTION.minMonths,

    rentPrice: null,
    rentMil: RENTAL.milPerMonth,
    rentExcess: RENTAL.excess,

    transit: true,
    transitPrice: NOCAR.transit,
    poolTrips: NOCAR.trips,
    poolHours: NOCAR.hours,
    poolKm: NOCAR.km,
    poolHourly: NOCAR.hourly,
    poolPerKm: NOCAR.perKm,
    holidayWeeks: NOCAR.weeks,
    weekPrice: NOCAR.weekPrice,

    benefit: false,
    marginalTax: 32,
    grossDeduction: 0
};
