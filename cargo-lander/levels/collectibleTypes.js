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
    // Time ring (L12's canyon race): fly through the hoop for extra seconds
    // on the mission clock. Drawn as an upright hoop, not a token.
    ring: {
        label: 'Time Ring',
        resource: 'time',
        amountField: 'seconds',
        defaultAmount: 5,
        radius: 34,
        pickupRadius: 40,
        color: '#22d3ee',
        edgeColor: '#0e7490',
        icon: '⏱',
        message: amount => `+${amount}s`,
        messageColor: '#22d3ee',
        draw(ctx, c) {
            const t = Date.now() / 1000, r = c.radius || 34;
            const pulse = 0.6 + 0.4 * Math.sin(t * 4 + c.x);
            ctx.save();
            ctx.translate(c.x, c.y);
            const g = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.5);
            g.addColorStop(0, 'rgba(34,211,238,0)'); g.addColorStop(0.6, `rgba(34,211,238,${0.18 * pulse})`); g.addColorStop(1, 'rgba(34,211,238,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = 6; ctx.strokeStyle = '#0e7490';
            ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 3; ctx.strokeStyle = `rgba(165,243,252,${0.6 + 0.4 * pulse})`;
            ctx.beginPath(); ctx.ellipse(0, 0, r * 0.45, r, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#cffafe'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`+${c.seconds ?? 5}s`, 0, -r - 10);
            ctx.restore();
        },
    },
};

window.COLLECTIBLE_TYPE_LIST = Object.keys(window.COLLECTIBLE_TYPES);
