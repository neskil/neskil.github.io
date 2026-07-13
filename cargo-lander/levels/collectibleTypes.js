// levels/collectibleTypes.js — shared registry of mid-air "flythrough" pickup
// types (level config `collectibles: [{ type, x, y, ... }]`).
//
// Read by BOTH:
//   - physics/atmosphere.js — generic collision/award logic in updateParticles()
//   - render/entities.js    — generic drawCollectibles() visual per type
//   - editor/editor.js      — sidebar list UI, add-button, canvas markers, export
// so a new pickup type (e.g. a shield/repair/ammo token) only needs an entry
// added HERE instead of being wired into physics, rendering, and the editor
// separately.
//
// Field shape per type:
//   resource      — key on physics state to credit (`cash`, `fuel`, ...) and
//                    the level-config field name are the same word by convention
//   amountField   — property name on the collectible object holding the award
//                    amount (level authors write e.g. `{ type:'cash', value:250 }`)
//   defaultAmount — used when amountField is absent on the collectible
//   radius        — visual token radius in world px (does NOT affect pickup)
//   pickupRadius  — flythrough pickup/collision radius in world px; defaults
//                    to `radius` if omitted
//   color/edgeColor — token fill/outline colors (also used by the editor marker)
//   icon          — single glyph drawn in the token
//   label         — human label for editor UI ("+ Cash", list headers, etc.)
//   message(amount) — text shown in the in-game pickup toast/floating text

window.COLLECTIBLE_TYPES = {
    cash: {
        label: 'Cash',
        resource: 'cash',
        amountField: 'value',
        defaultAmount: 100,
        radius: 24,
        pickupRadius: 36,
        color: '#facc15',
        edgeColor: '#92400e',
        icon: '$',
        message: amount => `+$${amount}`,
        messageColor: '#10b981',
    },
    fuel: {
        label: 'Fuel',
        resource: 'fuel',
        amountField: 'amount',
        defaultAmount: 25,
        radius: 22,
        pickupRadius: 34,
        color: '#60a5fa',
        edgeColor: '#1e3a8a',
        icon: '⛽',
        message: () => '+FUEL',
        messageColor: '#60a5fa',
    },
};

window.COLLECTIBLE_TYPE_LIST = Object.keys(window.COLLECTIBLE_TYPES);
