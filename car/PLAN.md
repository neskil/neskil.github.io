# Lease · Rent · Buy — what is left to do

Running list of work identified during the July 2026 review pass but not
finished in it. Ordered by how much each one would change an answer the page
currently gives.

## Done in that pass

- Split the 5,449-line `index.html` into `style.css` and nine plain scripts.
- Fixed the break-even chart, which dropped the dealer haircut, the mileage
  penalty and the scenario multiplier and so drew buying ~$80/mo cheaper than
  the bars said at the same month. Advertised crossover was out by 14 months.
- Made optimistic/pessimistic actually move resale, including when the resale
  field has been typed into; widened the band to post-COVID reality.
- Added fuel; rebased brand maintenance onto Edmunds TCO; gave body style a
  depreciation effect; fixed Georgia registration and the super-prime used APR.
- Answer-first ordering with separate narrow and wide layouts; folded the
  reference tail into collapsible panels.
- Restyled from glassmorphism to flat surfaces and a clay accent.

## Follow-up pass (August 2026)

- Bars carry direct labels, a shared scale and a caption; labels are per
  route and drop out when they will not fit.
- Every route names the vehicle it prices, and a callout says the four are
  not the same car.
- Every folded panel carries a standfirst; the three long explainers in the
  inputs panel fold too.
- Removed the nested scrollbar on the results column.

Still open from that: the page says the lease and subscription are different
cars but cannot say *how* different in money. Backing an implied vehicle price
out of a lease payment needs the residual and the money factor, which the page
does not ask for; the industry "1% of MSRP" rule of thumb is not reliable
enough to use — the $873 IAS quote is a ~$32k Tiguan, which that rule would
price at $87k. Asking for residual and money factor and computing a lease on
*your* car, alongside the quote you were given, would close it properly.

## 1. Electric and hybrid powertrains — the biggest remaining gap

Nothing on the page computes an EV or a hybrid, and both are now the extremes
of the depreciation distribution. iSeeCars 2026 has EVs losing **57.2%** over
five years against a 41.8% average, and hybrids losing only **35.4%** — better
than everything except pickups. The "Premium & EV" strategy card discusses EVs
in prose while the calculator behind it cannot model one.

Touches more than the curve:

- **Fuel** becomes kWh and a home/public rate split, not gallons and mpg. The
  input pair added in this pass assumes a combustion engine.
- **Georgia charges an EV registration surcharge** — $238.59/yr for
  non-commercial battery-electric registrations renewing between 1 Jul 2026 and
  30 Jun 2027, against $20 for a petrol tag. That is a real line the fees
  component should carry.
- **Insurance** runs higher on EVs (battery replacement dominates the payout).
- **Maintenance** runs lower — no oil, no exhaust, far less brake wear.
- Lease economics differ sharply because manufacturers subsidise EV residuals,
  which is exactly the case the pros-and-cons card already calls out.

Probably a `powertrain` chip row (petrol / hybrid / EV) alongside marque, shape
and age, feeding all five of the above.

## 2. Put maintenance on an age-banded cents-per-mile basis

Currently a brand ten-year total divided by 120 and scaled by an age curve and
a mileage factor. It was rebased in this pass so all four brands land on
Edmunds' TCO, but the structure still hides the disagreement between sources:

- YourMechanic's brand figures are repair labour through their own network, no
  tires, no scheduled service.
- AAA's 11.04 ¢/mile includes tires, full retail servicing **and** a
  comprehensive extended warranty — which this page should not carry, because
  it prices catastrophic repair risk separately in the pessimistic case.
- Edmunds and KBB each draw the line somewhere in between.

A cents-per-mile figure banded by age, with the warranty component named and
excluded explicitly, would be honest about which of those is being used and
would stop the ten-year total from implying a precision it does not have.

## 3. Retention by body style is half-sourced

`BODY_TYPES.depMult` reproduces the iSeeCars pickup figure exactly (65.9%
modelled against 65.8% published). Sedans, compact cars and three-row SUVs sit
at or near 1.00 because that study does not break them out — they are
placeholders, not measurements. Either find segment retention (Black Book or
Cox publish it) or collapse those four to exactly 1.00 and say so, rather than
carrying invented 0.97/1.02/0.98 values.

## 4. Insurance does not fall as the car ages

`AGE_BANDS[].insMult` is applied once, when the profile is set from the age you
bought at. Over a ten-year hold the premium then stays flat, when in reality
comprehensive and collision fall with the payout — which is the mechanism the
page's own insurance callout describes at length. Should decay across the
horizon the way maintenance climbs across it.

## 5. Date-stamp the quotes, and the market itself

- The Sixt+ ($1,000 / 500 mi), Flexcar ($850) and IAS Tiguan ($873) figures are
  real point-in-time quotes with no date attached. They will rot silently.
- The depreciation curves are fitted to a single 2026 snapshot of a market that
  has moved every year since 2020 — 45.6% five-year depreciation in the 2025
  study, 41.8% in the 2026 one. A page that models a ten-year hold should
  either say the curve is a snapshot or let the user shift the whole market up
  and down, which is arguably what the scenario toggle should have been doing
  all along.

## 6. Regenerate the Open Graph image

`assets/og/car.png` shows the old glassmorphism styling and a "$555 per month"
headline that no longer matches anything. `og:image:alt` in `index.html`
repeats that stale number in text. Both need redoing after the restyle.

## 7. A committed test harness

The break-even fix was verified with a throwaway Playwright script asserting
that all four routes agree between the bars and the curve across horizons,
scenarios, disposal channels, mileages and a typed resale override. That check
is worth keeping — `supply-chain/tests.html` is the repo's existing pattern for
a page that self-tests over `file://`, and this page's model is now in its own
module and directly exercisable.

## 8. All-pairs colourblind separation

Pre-existing and inherited: the categorical series pass adjacent-pair CVD
separation but fail `--pairs all` (worst pair ΔE 1.6 deutan). Mitigated the way
the skill allows — legend always present, per-segment tooltips, a numbers table
and now a 2px surface gap between fills — but a texture fill or a faceted view
would settle it properly.

## 9. Smaller things

- The folded reference tail is eight panels deep with only two entries in the
  jump index; it could use its own contents list.
- `mileagePenalty` clamps at 0.60/1.10 with no comment on where those bounds
  came from.
- `LEASE_MAINTENANCE_SHARE = 0.45` is a single flat number for "you buy tires
  and oil but not a transmission" — plausible, unsourced.
- The walkthrough recap does not show the new fuel inputs.
- `BODY_TYPES.truck.notFor: ['germanLux']` is honoured by the walkthrough's
  choice list but not by the body chip row on the page, so you can still select
  German luxury + pickup there and get a price for a car nobody sells.
