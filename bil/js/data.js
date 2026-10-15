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
   car still under warranty, at about 1 250 mil: an EV is not reliably
   cheaper (Vi Bilägare paid 4 759 kr for a Kia EV3 service at 3 000 mil;
   comparison calculators give 2 500–3 000 kr for an EV against 5 000–7 000
   for petrol). CO2 is a default for the field, not a claim about any
   model. */
export const POWERTRAINS = {
    el:         { label: 'Electric',        sv: 'Elbil',       kwhPerMil: 1.9, litrePerMil: 0,    fuel: null,     electricShare: 1,   service: 3000, co2: 0 },
    laddhybrid: { label: 'Plug-in hybrid',  sv: 'Laddhybrid',  kwhPerMil: 2.0, litrePerMil: 0.60, fuel: 'petrol', electricShare: 0.5, service: 4800, co2: 30 },
    hybrid:     { label: 'Hybrid',          sv: 'Elhybrid',    kwhPerMil: 0,   litrePerMil: 0.45, fuel: 'petrol', electricShare: 0,   service: 4000, co2: 105 },
    bensin:     { label: 'Petrol',          sv: 'Bensin',      kwhPerMil: 0,   litrePerMil: 0.65, fuel: 'petrol', electricShare: 0,   service: 4800, co2: 140 },
    diesel:     { label: 'Diesel',          sv: 'Diesel',      kwhPerMil: 0,   litrePerMil: 0.55, fuel: 'diesel', electricShare: 0,   service: 5200, co2: 135 }
};

/* ── Resale (värdeminskning) ─────────────────────────────────────
   Share of today's new price a private buyer pays for the same model at
   one, three and five years. Brand groups first, then a curve of its own
   for each preset car.

   October 2026 asking prices, as a share of today's new price, times 0.93
   because dealer asking prices sit above what a private sale fetches
   (bilmarknadsdata.se puts the trade-in gap at 15–25 %, Carup a dealer's
   mark-up at 15–19 %):
     Volvo XC60 T6 plug-in: 2023 about 450 000 kr, 2021 about 380 000
       (Carla, Riddermark, Bilweb), new about 670 000 → 0.61 and 0.52.
     VW Golf: 2023 eTSI 220 000–242 000, 2021 median 225 000 (Carpicker,
       Bilweb), new 349 900 → 0.61 and 0.53.
     VW Tiguan TDI: 2022 about 330 000, 2021 260 000–360 000 (KVD,
       Riddermark), new 465 000 → 0.64 and 0.56.
     Tesla Model Y: medians 379 800 (2023), 359 900 (2022), 329 800 (2021)
       (Carpicker), Long Range new about 600 000 → 0.59 and 0.51.
     Volvo EX30: 2024 Extended Range 340 000–380 000 at Volvo dealers,
       314 900 at a KVD fixed price, new 479 900 → about 0.70 at two years.
     Kia EV3: a 2025 Long Range at 419 900 against 470 000–508 000 new →
       about 0.79 at one year; three and five are estimates.
   Real listings hold value better than the brand ranges published as
   rules of thumb (Toyota 55–68 % at three years, Volvo 50–62 %,
   BMW/Mercedes 46–60 %, Kia/Hyundai 47–62 %, Tesla 52–62 %), so the brand
   groups now sit at the top of those ranges where listings back that, and
   at their midpoints where nothing does (premium, other).
   After year five the yearly loss slows to 70 % of the year-3-to-5 pace.
   An electric car on a brand-group curve, from a brand that mostly sells
   combustion cars, loses 12 % more (VW ID.4 and Polestar 2 lost about
   40 % in three model years against about 31 % for an XC60 hybrid). */
export const RESIDUAL_GROUPS = {
    toyota:  { label: 'Toyota, Lexus',              sv: 'Toyota, Lexus',              r1: 0.87, r3: 0.65, r5: 0.56 },
    volvo:   { label: 'Volvo, VW, Škoda, Cupra',    sv: 'Volvo, VW, Škoda, Cupra',    r1: 0.85, r3: 0.61, r5: 0.52 },
    premium: { label: 'BMW, Mercedes, Audi',        sv: 'BMW, Mercedes, Audi',        r1: 0.82, r3: 0.53, r5: 0.42 },
    korean:  { label: 'Kia, Hyundai',               sv: 'Kia, Hyundai',               r1: 0.82, r3: 0.56, r5: 0.45 },
    evbrand: { label: 'Tesla, Polestar',            sv: 'Tesla, Polestar',            r1: 0.80, r3: 0.58, r5: 0.49 },
    other:   { label: 'Other brands',               sv: 'Övriga märken',               r1: 0.82, r3: 0.55, r5: 0.44 }
};
export const LATE_PHASE = 0.7;
export const EV_LOSS_MULT = 1.12;
export const AVERAGE_MIL = 1250;            // Trafikanalys: 1 243 mil per car in 2025
export const VALUE_PER_1000_MIL = 0.02;     // ≈ share of value lost per 1 000 mil above average

/* How you sell at the end, as a share of what a private buyer would pay,
   plus the seller's costs.
     Private (Blocket, Wayke): the full price, less a 495 kr ad.
     KVD auction: close to a private price, less a fee that scales with
       the price: on KVD's older schedule 10 % with a 5 875 kr floor and a
       9 875 kr cap (the 2026 table is not published; withdrawing a car
       costs 4 375 kr). Selling straight to KVD has no fee and a lower price.
     Dealer trade-in: 15–25 % under the private price (bilmarknadsdata.se,
       2026); 5–15 % under market (Moveabout); private prices 15.8 % over
       trade-in for a Golf and 22.1 % for a Tiguan (Blipp) → −15 %.
     Direct buyer (Riddermark, Carla): 15–25 % under market (Moveabout),
       10–25 % under Blocket in forum reports → −18 %.
   There is no US-style sales-tax credit on a trade-in: it is simply a sale. */
export const EXITS = {
    privat:    { label: 'Private sale (Blocket, Wayke)', sv: 'Privat (Blocket, Wayke)', haircut: 0.00, fee: 495 },
    auktion:   { label: 'Auction (KVD)',                 sv: 'Auktion (KVD)',     haircut: 0.03, feeShare: 0.10, feeMin: 5875, feeMax: 9875 },
    inbyte:    { label: 'Dealer trade-in',               sv: 'Inbyte hos handlare', haircut: 0.15, fee: 0 },
    uppkopare: { label: 'Direct buyer (Riddermark, Carla)', sv: 'Direktuppköpare (Riddermark, Carla)', haircut: 0.18, fee: 0 }
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
   city address at ×1.20. Brand matters more than value at the top: a
   Tesla Model Y Long Range was quoted about 28 000 kr a year at
   Trygg-Hansa and 2 600–4 100 kr a month at Zmarta (30-year-old,
   Stockholm), against Hedvig's brand averages of 569 kr a month for Volvo
   and 508 for Kia. Those Tesla quotes are the extreme: Allaforsakringar
   puts a Model 3 10–20 % above a Volvo V60 at the same price, and
   electric cars in general 15–30 % above a comparable petrol car
   (Premiva, minbilkoll.se; E55's 40 % compares whole fleets, not twins).
   Drivers under 25 pay 30–50 % more (an 18-year-old in a 2018 V40 in
   Stockholm 580–780 kr/mo against 380–450 at 25), often with an extra
   excess too. No source publishes a city-against-countryside figure. */
export const INSURANCE = {
    helBase: 3000,
    helPerKr: 0.012,
    halvShare: 0.5,
    garantiMonths: 36,
    youngMult: 1.45,
    cityMult: 1.20,
    groupMult: { evbrand: 1.6, premium: 1.3 },   // ≈
    evMult: 1.2                                  // EVs: 15–30 % above petrol twins
};

/* ── Service, tyres, inspection ──────────────────────────────────
   Service grows with age once the warranty runs out (≈ multipliers).
   Tyres: one summer and one winter set, each lasting about 6 000 mil;
   four friction tyres cost 4 500–8 000 kr (from 1 166–1 308 kr a tyre).
   A new car needs complete winter wheels: 13 900 kr for a 17" set, 15 900
   for 18" (Lassa via Bilia Outlet), 26 800–27 800 for Volvo's own 18"
   (Bilia). A swap is 395–550 kr; a däckhotell with the swap 600–1 600 kr
   a season.
   Winter tyres are compulsory 1 December – 31 March in winter conditions
   (2 000 kr fine since February 2025); studs allowed 1 October – 15 April.
   Besiktning: first within 36 months, then 24, then every 14 months;
   395–525 kr at the four big chains in 2026. */
export const UPKEEP = {
    ageMult: [ [3, 1.0], [6, 1.6], [10, 2.3], [Infinity, 3.0] ],
    tyreSet: { small: 5000, mid: 6500, large: 10000 },
    rimSet:  { small: 8900, mid: 9400, large: 16800 },    // complete winter wheels less the tyres on them
    rimResale: 0.4,
    tyreLifeMil: 6000,
    evTyreWear: 1.15,
    swap: 450,
    hotelYear: 1500,
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
   room in the mortgage: three-month mortgage rates averaged 2.58–2.75 % in
   September 2026 (Skandia, Danske Bank, Nordea), with Riksbanken at
   1.75 %. */
export const LOANS = {
    billan:    { label: 'Car loan via the dealer', sv: 'Billån (bilen som säkerhet)', rate: 0.065, minDown: 0.20, deductible: true,  setup: 595, monthlyFee: 29, needsHome: false },
    privatlan: { label: 'Unsecured private loan',  sv: 'Privatlån utan säkerhet',     rate: 0.095, minDown: 0,    deductible: false, setup: 0,   monthlyFee: 29, needsHome: false },
    bolan:     { label: 'Mortgage top-up',         sv: 'Utökat bolån',                rate: 0.027, minDown: 0,    deductible: true,  setup: 0,   monthlyFee: 0,  needsHome: true }
};

/* ── Privatleasing ───────────────────────────────────────────────
   36 months, no down payment, service usually included; insurance,
   vehicle tax and winter wheels on top. A Volvo EX30 leased for
   3 495–3 790 kr/mo on 36 months and 1 000 mil a year in autumn 2026
   (about 0.85 % of its 429 000 kr list price a month), and Volvo's own
   price list starts it at 3 895; an EX40 4 895–4 995; a Kia EV3 4 495
   (Kia, 1 000 mil, service included, September 2026); a Tesla Model Y from
   4 595. Each extra 500 mil a year adds 300–349 kr/mo (Stendahls,
   Bilbolaget). The fee floats with Stibor 90 at Volvo's dealers.
   Excess mileage 10–20 kr/mil (Volvo 12). Abnormal wear is charged at
   return. Many contracts float with the lessor's funding rate. */
export const LEASE = {
    shareOfPrice: 0.0088,
    baseMil: 1000,
    stepMil: 500,
    stepPrice: 349,
    overMil: 12,
    setup: 595,
    returnDamage: 4500,   // ≈ expected per return; bills of 5 000–25 000 kr are common
    term: 36
};

/* ── Bilabonnemang ───────────────────────────────────────────────
   One price including insurance, vehicle tax, service and tyres, and a
   short notice period. In 2026: Schysst from 3 990 kr/mo with
   helförsäkring and no lock-in; Novus Mobility 2 995–7 495 kr/mo on 3–24
   months; Care by Volvo from 5 590–5 990 kr/mo on three months' notice;
   imove from 10 990. ≈ 1.4 % of list price a month. */
export const SUBSCRIPTION = {
    shareOfPrice: 0.014,
    floor: 3990,
    milPerMonth: 150,
    excess: 25,           // ≈ kr/mil
    minMonths: 3
};

/* ── Långtidshyra (monthly rental) ───────────────────────────────
   Kinto Flex from 5 999–6 399 kr/mo with 300 mil a month and 2 kr/km
   over; Avis Minilease from 7 495 kr/mo for a Peugeot 2008 or similar,
   150 mil a month and 5 kr/km over, basic insurance with a 9 500 kr
   excess; Volvo Car Retail from 9 990 kr/mo with 300 mil, service, extra
   driver, tax and basic insurance, 25 kr per mil over. */
export const RENTAL = {
    monthly: { small: 6399, mid: 9990, large: 12990 },   // large ≈
    milPerMonth: 300,
    excess: 25,
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
    { key: 'ex30',  label: 'Volvo EX30',            price: 429000, age: 0, powertrain: 'el',         co2: 0,   group: 'volvo',   leaseQuote: 3895, resale: { r1: 0.82, r3: 0.64, r5: 0.53 } },
    { key: 'ev3',   label: 'Kia EV3',               price: 429900, age: 0, powertrain: 'el',         co2: 0,   group: 'korean',  leaseQuote: 4495, resale: { r1: 0.79, r3: 0.58, r5: 0.47 } },
    { key: 'my',    label: 'Tesla Model Y',         price: 499990, age: 0, powertrain: 'el',         co2: 0,   group: 'evbrand', leaseQuote: 4595, resale: { r1: 0.80, r3: 0.59, r5: 0.51 } },
    { key: 'xc60',  label: 'Volvo XC60 plug-in',    sv: 'Volvo XC60 laddhybrid',    price: 569900, age: 0, powertrain: 'laddhybrid', co2: 23,  group: 'volvo', resale: { r1: 0.86, r3: 0.61, r5: 0.52 } },
    { key: 'golf',  label: 'VW Golf eTSI',          price: 349900, age: 0, powertrain: 'bensin',     co2: 124, group: 'volvo',   consumption: 0.54, resale: { r1: 0.85, r3: 0.61, r5: 0.53 } },
    { key: 'tiguan', label: 'VW Tiguan TDI',        price: 465000, age: 0, powertrain: 'diesel',     co2: 164, group: 'volvo',   consumption: 0.63, resale: { r1: 0.87, r3: 0.64, r5: 0.56 } },
    { key: 'used',  label: 'Used petrol, 5 years',  sv: 'Begagnad bensin, 5 år', price: 200000, age: 5, powertrain: 'bensin', co2: 140, group: 'volvo' }
];

/* ── The page's starting point ───────────────────────────────────── */
export const DEFAULTS = {
    preset: 'ex30',
    model: 'ex30',          // whose resale curve to use; null = the brand group's
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
    altReturn: 2.5,
    loanType: 'billan',
    loanRate: null,         // null = the loan type's default
    down: 20,
    loanTerm: 60,
    exit: 'inbyte',
    remark: false,
    income: true,
    card: true,
    home: false,

    leaseQuote: 3895,
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
    grossDeduction: 0,

    /* A second car to compare against, priced through the same routes with
       the same driving and money. Only the car itself differs. */
    compare: false,
    bPreset: 'golf',
    bModel: 'golf',
    bPrice: 349900,
    bAge: 0,
    bPowertrain: 'bensin',
    bCo2: 124,
    bGroup: 'volvo',
    bLeaseQuote: null,
    bConsumption: 0.54
};
