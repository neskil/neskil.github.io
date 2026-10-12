/**
 * cargo-packer/core/manifests.js
 * Benchmark cargo scenarios, diverse box manifests, and procedural cargo generation.
 * Strictly NO Three.js and NO DOM dependencies.
 */
(function(exports) {
  'use strict';

  const Types = (typeof module !== 'undefined' && module.exports) ? require('./types') : window.CargoPacker;

  /**
   * Mulberry32 Seeded Pseudo-Random Number Generator.
   * Produces 100% deterministic pseudo-random floats in [0, 1).
   */
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * The fixed scenarios as type tables: one row per kind of box, with how
   * many of it the scenario ships by default. The cargo editor changes those
   * counts; buildManifest turns a table plus counts into the item list.
   * Item ids run `${prefix}_1…n` in table order, so the defaults reproduce the
   * exact manifests the algorithms were tuned and tested on.
   */
  const MANIFEST_TYPES = {
    // Scenario 1: E-Commerce Express — 7 aspect ratios testing 3D void-filling
    ecommerce: { prefix: 'ec', types: [
      { key: 'micro', name: 'Micro Parcel', w: 0.24, h: 0.16, d: 0.12, weight: 1.2, count: 16,
        opts: { color: '#38bdf8', category: 'parcel', boxStyle: 'ecommerce' } },
      { key: 'shoebox', name: 'Shoebox Parcel', w: 0.35, h: 0.22, d: 0.15, weight: 2.5, count: 18,
        opts: { color: '#a855f7', category: 'parcel', boxStyle: 'standard' } },
      { key: 'book', name: 'Flat Book Pack', w: 0.38, h: 0.08, d: 0.28, weight: 2.0, count: 14,
        opts: { color: '#10b981', category: 'parcel', boxStyle: 'ecommerce' } },
      { key: 'medium', name: 'Medium Carton', w: 0.45, h: 0.35, d: 0.30, weight: 8, count: 14,
        opts: { color: '#c29b62', category: 'carton', boxStyle: 'standard' } },
      { key: 'tower', name: 'Tower Carton', w: 0.35, h: 0.35, d: 0.75, weight: 12, count: 8,
        opts: { color: '#06b6d4', category: 'carton', boxStyle: 'standard' } },
      { key: 'appliance', name: 'Appliance Carton', w: 0.60, h: 0.50, d: 0.45, weight: 22, count: 8,
        opts: { color: '#f59e0b', category: 'carton', boxStyle: 'heavy' } },
      { key: 'tube', name: 'Postal Cylinder', w: 0.22, h: 0.22, d: 1.20, weight: 6, count: 6,
        opts: { color: '#ec4899', category: 'tube', boxStyle: 'standard' } }
    ] },

    // Scenario 2: FMCG Retail — EUR-pallet modular footprints (60x40, 40x30, 40x20)
    fmcg: { prefix: 'fmcg', types: [
      { key: 'caseA', name: 'Master Case A (60x40)', w: 0.60, h: 0.40, d: 0.40, weight: 18, count: 20,
        opts: { color: '#0284c7', category: 'carton', boxStyle: 'standard' } },
      { key: 'caseB', name: 'Master Case B (40x30)', w: 0.40, h: 0.30, d: 0.30, weight: 10, count: 24,
        opts: { color: '#6366f1', category: 'carton', boxStyle: 'standard' } },
      { key: 'packC', name: 'Retail Pack C (40x20)', w: 0.40, h: 0.20, d: 0.25, weight: 5, count: 20,
        opts: { color: '#14b8a6', category: 'carton', boxStyle: 'standard' } }
    ] },

    // Scenario 3: Industrial — heavy crates, steel drums, fragile electronics
    industrial: { prefix: 'ind', types: [
      { key: 'generator', name: 'Generator Crate', w: 1.30, h: 1.00, d: 1.10, weight: 900, count: 4,
        opts: { color: '#b45309', category: 'crate', boxStyle: 'wood_slat', allowedOrientations: 'this_side_up' } },
      { key: 'skid', name: 'Machine Skid', w: 0.90, h: 0.70, d: 0.80, weight: 450, count: 6,
        opts: { color: '#92400e', category: 'crate', boxStyle: 'reinforced', allowedOrientations: 'this_side_up' } },
      { key: 'drum', name: 'Steel Drum 200L', w: 0.60, h: 0.90, d: 0.60, weight: 210, count: 12,
        // Steel grey and industrial blue, alternating
        opts: { colors: ['#475569', '#0284c7'], category: 'drum', boxStyle: 'drum', allowedOrientations: 'this_side_up' } },
      { key: 'spares', name: 'Spares Box', w: 0.75, h: 0.45, d: 0.50, weight: 140, count: 10,
        opts: { color: '#0f766e', category: 'crate', boxStyle: 'wood_slat' } },
      { key: 'electronics', name: 'Fragile Electronics', w: 0.45, h: 0.30, d: 0.35, weight: 12, count: 12,
        opts: { color: '#dc2626', category: 'carton', boxStyle: 'fragile', fragile: true, maxTopWeight: 20 } },
      { key: 'pump', name: 'Pump Housing', w: 0.50, h: 0.40, d: 0.40, weight: 65, count: 8,
        opts: { color: '#ea580c', category: 'carton', boxStyle: 'heavy' } }
    ] },

    // Scenario 4: Extreme Aspect Ratios — slabs, towers and pipes for 6-way rotation
    irregular: { prefix: 'irr', types: [
      { key: 'panel', name: 'Flat Display Panel', w: 0.95, h: 0.12, d: 0.70, weight: 18, count: 14,
        opts: { color: '#8b5cf6', category: 'carton', boxStyle: 'fragile' } },
      { key: 'beam', name: 'Long Timber Skid', w: 0.25, h: 0.25, d: 1.60, weight: 42, count: 8,
        opts: { color: '#d97706', category: 'crate', boxStyle: 'wood_slat' } },
      { key: 'server', name: 'Server Tower 24U', w: 0.45, h: 0.45, d: 1.10, weight: 55, count: 8,
        opts: { color: '#0284c7', category: 'carton', boxStyle: 'heavy' } },
      { key: 'cube', name: 'Hardware Cube', w: 0.35, h: 0.35, d: 0.35, weight: 35, count: 16,
        opts: { color: '#10b981', category: 'carton', boxStyle: 'standard' } },
      { key: 'flatCrate', name: 'Flat Equipment Crate', w: 0.80, h: 0.22, d: 0.80, weight: 28, count: 8,
        opts: { color: '#b45309', category: 'crate', boxStyle: 'wood_slat' } }
    ] },

    // Scenario 6: EUR-Pallet — sized for a 1.2 x 0.8 x 1.8 m pallet
    pallet: { prefix: 'pal', types: [
      { key: 'export', name: 'Export Carton', w: 0.40, h: 0.30, d: 0.25, weight: 12, count: 18,
        opts: { color: '#0284c7', category: 'carton', boxStyle: 'standard' } },
      { key: 'half', name: 'Half Carton', w: 0.40, h: 0.20, d: 0.25, weight: 6, count: 14,
        opts: { color: '#f59e0b', category: 'carton', boxStyle: 'standard' } }
    ] }
  };

  /** Most of any one type the editor allows; keeps a solve interactive. */
  const MAX_PER_TYPE = 120;

  /**
   * @param {string} scenarioId Key of MANIFEST_TYPES
   * @param {Object<string, number>} [counts] Per-type counts; missing keys use the default
   */
  function buildManifest(scenarioId, counts = {}) {
    const def = MANIFEST_TYPES[scenarioId];
    const items = [];
    let id = 1;
    def.types.forEach(t => {
      const n = Math.max(0, Math.min(MAX_PER_TYPE, Math.round(counts[t.key] !== undefined ? counts[t.key] : t.count)));
      for (let i = 0; i < n; i++) {
        const opts = Object.assign({}, t.opts);
        if (opts.colors) {
          opts.color = opts.colors[i % opts.colors.length];
          delete opts.colors;
        }
        items.push(Types.createItem(`${def.prefix}_${id++}`, t.name, t.w, t.h, t.d, t.weight, opts));
      }
    });
    return items;
  }

  const getEcommerceManifest = counts => buildManifest('ecommerce', counts);
  const getFmcgManifest = counts => buildManifest('fmcg', counts);
  const getIndustrialManifest = counts => buildManifest('industrial', counts);
  const getIrregularManifest = counts => buildManifest('irregular', counts);
  const getPalletManifest = counts => buildManifest('pallet', counts);

  /**
   * Scenario 5: Procedural Chaos / Randomized Seeded Manifest
   * Generates a completely custom, randomized mix of box sizes, shapes, and weights
   * with 100% reproducible determinism based on seed.
   */
  function generateRandomManifest(seed = 42, count = 70) {
    const prng = mulberry32(seed);
    const items = [];

    const PALETTE = [
      '#c29b62', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#64748b', '#ea580c', '#e2d9cc'
    ];

    const STYLES = ['standard', 'ecommerce', 'heavy', 'fragile', 'wood_slat'];

    for (let i = 1; i <= count; i++) {
      const typeRoll = prng();
      let w, h, d, wt, category, style, name, color;

      if (typeRoll < 0.12) {
        // Flat slab / panel (e.g. 0.70 - 1.05m wide, 0.08 - 0.18m high, 0.40 - 0.75m deep)
        w = +(0.70 + prng() * 0.35).toFixed(2);
        h = +(0.08 + prng() * 0.12).toFixed(2);
        d = +(0.40 + prng() * 0.35).toFixed(2);
        wt = Math.round(10 + prng() * 18);
        category = 'carton';
        style = 'fragile';
        name = `Flat Panel #${i}`;
        color = '#8b5cf6';
      } else if (typeRoll < 0.24) {
        // Tall tower / column (e.g. 0.30 - 0.45m wide, 0.70 - 1.15m high, 0.30 - 0.45m deep)
        w = +(0.30 + prng() * 0.15).toFixed(2);
        h = +(0.70 + prng() * 0.45).toFixed(2);
        d = +(0.30 + prng() * 0.15).toFixed(2);
        wt = Math.round(18 + prng() * 32);
        category = 'carton';
        style = 'heavy';
        name = `Tower Unit #${i}`;
        color = '#0284c7';
      } else if (typeRoll < 0.36) {
        // Long skid / tube (e.g. 0.18 - 0.26m wide, 0.18 - 0.26m high, 0.90 - 1.40m deep)
        w = +(0.18 + prng() * 0.08).toFixed(2);
        h = +(0.18 + prng() * 0.08).toFixed(2);
        d = +(0.90 + prng() * 0.50).toFixed(2);
        wt = Math.round(6 + prng() * 20);
        category = prng() > 0.5 ? 'tube' : 'crate';
        style = category === 'tube' ? 'standard' : 'wood_slat';
        name = `Long Cargo #${i}`;
        color = '#ea580c';
      } else if (typeRoll < 0.50) {
        // Micro parcel / small box (e.g. 0.20 - 0.32m wide, 0.12 - 0.22m high, 0.15 - 0.28m deep)
        w = +(0.20 + prng() * 0.12).toFixed(2);
        h = +(0.12 + prng() * 0.10).toFixed(2);
        d = +(0.15 + prng() * 0.13).toFixed(2);
        wt = +(1.5 + prng() * 3.5).toFixed(1);
        category = 'parcel';
        style = 'ecommerce';
        name = `Parcel #${i}`;
        color = PALETTE[Math.floor(prng() * PALETTE.length)];
      } else if (typeRoll < 0.70) {
        // Standard medium shipping carton (e.g. 0.35 - 0.55m wide, 0.25 - 0.42m high, 0.30 - 0.45m deep)
        w = +(0.35 + prng() * 0.20).toFixed(2);
        h = +(0.25 + prng() * 0.17).toFixed(2);
        d = +(0.30 + prng() * 0.15).toFixed(2);
        wt = Math.round(8 + prng() * 16);
        category = 'carton';
        style = 'standard';
        name = `Carton #${i}`;
        color = '#c29b62';
      } else if (typeRoll < 0.85) {
        // Large box / appliance (e.g. 0.50 - 0.75m wide, 0.40 - 0.65m high, 0.45 - 0.65m deep)
        w = +(0.50 + prng() * 0.25).toFixed(2);
        h = +(0.40 + prng() * 0.25).toFixed(2);
        d = +(0.45 + prng() * 0.20).toFixed(2);
        wt = Math.round(20 + prng() * 35);
        category = 'carton';
        style = 'heavy';
        name = `Appliance #${i}`;
        color = '#f59e0b';
      } else {
        // Heavy timber crate or drum
        const isDrum = prng() > 0.6;
        if (isDrum) {
          w = +(0.55 + prng() * 0.10).toFixed(2);
          h = +(0.85 + prng() * 0.10).toFixed(2);
          d = w;
          wt = Math.round(180 + prng() * 60);
          category = 'drum';
          style = 'drum';
          name = `Drum #${i}`;
          color = '#64748b';
        } else {
          w = +(0.70 + prng() * 0.40).toFixed(2);
          h = +(0.60 + prng() * 0.35).toFixed(2);
          d = +(0.60 + prng() * 0.40).toFixed(2);
          wt = Math.round(120 + prng() * 250);
          category = 'crate';
          style = 'wood_slat';
          name = `Timber Crate #${i}`;
          color = '#b45309';
        }
      }

      items.push(Types.createItem(`rnd_${seed}_${i}`, name, w, h, d, wt, {
        color: color,
        category: category,
        boxStyle: style,
        allowedOrientations: (category === 'drum' || style === 'reinforced') ? 'this_side_up' : 'any'
      }));
    }

    return items;
  }

  let currentRandomSeed = 1337;

  /**
   * Evaluates every registered algorithm head-to-head on the given items and container.
   * Generates side-by-side volume metrics, winner ranking, and analytical insights.
   */
  function compareAlgorithms(items, container, options = {}) {
    const Registry = (typeof module !== 'undefined' && module.exports) ? require('./algorithms') : window.CargoPacker;
    const opt = Object.assign({ minSupportRatio: 0.60 }, options);

    const total = items.length;
    // A pallet grows upwards; a container fills from the back bulkhead to the
    // doors. Either way, what is left over for more cargo is what matters.
    const isPallet = container.length < 2;
    const summarize = (id, name, shortName, result) => {
      // The block of container the cargo actually occupies. When every
      // algorithm loads the whole manifest, fill % ties and this is what
      // separates them: a tighter block leaves the rest of the box free.
      let envW = 0, envH = 0, envL = 0;
      result.placed.forEach(p => {
        envW = Math.max(envW, p.x + p.w);
        envH = Math.max(envH, p.y + p.h);
        envL = Math.max(envL, p.z + p.d);
      });
      const envVolume = envW * envH * envL;
      const extent = isPallet ? envH : envL;
      return {
        id: id,
        name: name,
        shortName: shortName,
        volumeUtilization: result.metrics.volumeUtilization,
        placedCount: result.placed.length,
        unplacedCount: result.unplaced.length,
        totalCount: total,
        cargoVolume: result.metrics.cargoVolume,
        cargoWeight: result.metrics.cargoWeight,
        cogStatus: result.metrics.cog.status,
        envelope: { width: +envW.toFixed(2), height: +envH.toFixed(2), length: +envL.toFixed(2) },
        density: envVolume > 0 ? +((result.metrics.cargoVolume / envVolume) * 100).toFixed(1) : 0,
        // Length of floor used (container) or stack height (pallet)
        extent: +extent.toFixed(2),
        extentLabel: isPallet ? `${extent.toFixed(2)} m tall` : `${extent.toFixed(2)} m used`,
        result: result
      };
    };

    const results = {};
    Registry.ALGORITHMS.forEach(algo => {
      results[algo.id] = Object.assign(
        summarize(algo.id, algo.name, algo.shortName, algo.run(items, container, opt)),
        { quality: algo.quality }
      );
    });

    // More cargo loaded wins; when that ties, the load that leaves the most
    // room (least floor used, or the lowest stack) wins, then the denser one.
    const ranking = Registry.ALGORITHMS.map(a => a.id);
    ranking.sort((a, b) => {
      if (Math.abs(results[b].volumeUtilization - results[a].volumeUtilization) > 0.1) {
        return results[b].volumeUtilization - results[a].volumeUtilization;
      }
      if (results[b].placedCount !== results[a].placedCount) {
        return results[b].placedCount - results[a].placedCount;
      }
      if (Math.abs(results[a].extent - results[b].extent) > 0.005) {
        return results[a].extent - results[b].extent;
      }
      return results[b].density - results[a].density;
    });

    const winner = results[ranking[0]];
    const runnerUp = results[ranking[1]];
    const volumeGap = winner.volumeUtilization - runnerUp.volumeUtilization;
    const tiedOnVolume = volumeGap <= 0.1 && winner.placedCount === runnerUp.placedCount;

    const extentOf = r => isPallet ? `stands ${r.envelope.height.toFixed(2)} m tall` : `uses ${r.envelope.length.toFixed(2)} m of floor`;
    const possessive = name => name.endsWith('s') ? `${name}'` : `${name}'s`;

    let insight;
    let lead;
    if (tiedOnVolume) {
      const allLoaded = ranking.every(id => results[id].unplacedCount === 0);
      lead = isPallet ? 'lowest stack' : 'least floor used';
      const room = isPallet ? 'the lowest stack' : 'the most room for more';
      insight = `${allLoaded ? 'Every algorithm loads the full manifest' : 'Fill is tied'}, so ${room} wins: ` +
        `${possessive(winner.shortName)} load ${extentOf(winner)} (${winner.density}% solid cargo); ` +
        `${possessive(runnerUp.shortName)} ${extentOf(runnerUp)} (${runnerUp.density}%).`;
    } else {
      lead = `+${volumeGap.toFixed(1)}% fill`;
      const left = runnerUp.totalCount - runnerUp.placedCount;
      insight = `${winner.shortName} loads ${winner.placedCount}/${total} items (+${volumeGap.toFixed(1)}% volume); ` +
        `${runnerUp.shortName} leaves ${left} item${left === 1 ? '' : 's'} on the dock.`;
    }
    insight += ' ' + Registry.getAlgorithm(winner.id).winNote;
    const worst = results[ranking[ranking.length - 1]];
    if (worst.unplacedCount > 0) {
      insight += ` Bottom of the table: ${worst.shortName}, with ${worst.unplacedCount} left on the dock.`;
    }

    return {
      results: results,
      winner: winner,
      lead: lead,
      ranking: ranking.map(id => results[id]),
      insight: insight
    };
  }

  /** Most items the random scenario will generate. */
  const MAX_RANDOM = 200;

  /*
   * Each preset's getItems takes an optional cargo override from the editor:
   * { counts: { typeKey: n } } for the fixed scenarios, { count: n } for the
   * random one. blurb(n) describes the load for n items.
   */
  const fixed = (id, name, containerId, blurb) => ({
    id: id,
    name: name,
    containerId: containerId,
    types: MANIFEST_TYPES[id].types,
    blurb: blurb,
    getItems: cargo => buildManifest(id, cargo && cargo.counts)
  });

  const PRESETS = {
    ecommerce: fixed('ecommerce', 'E-Commerce Mixed Parcels', 'iso20',
      n => `${n} heterogeneous parcels across 7 size categories`),
    fmcg: fixed('fmcg', 'FMCG Retail Cartons', 'iso20',
      n => `${n} modular interlocking distribution cartons`),
    industrial: fixed('industrial', 'Industrial Machinery & Drums', 'iso20',
      n => `${n} heavy crates & chemical drums testing balance`),
    irregular: fixed('irregular', 'Extreme Aspect Ratios', 'iso20',
      n => `${n} flat panels, tall towers & long skids (6-way rotation)`),
    random: {
      id: 'random',
      name: 'Procedural Chaos (Random Sizes)',
      containerId: 'iso20',
      isRandom: true,
      defaultCount: 70,
      maxCount: MAX_RANDOM,
      blurb: n => `${n} randomized cartons, crates & drums`,
      getItems: cargo => generateRandomManifest(currentRandomSeed,
        Math.max(1, Math.min(MAX_RANDOM, Math.round(cargo && cargo.count !== undefined ? cargo.count : 70))))
    },
    pallet: fixed('pallet', 'EUR-Pallet Stacking', 'pallet',
      n => `${n} cartons on standard 1.2m × 0.8m wooden base`)
  };

  exports.PRESETS = PRESETS;
  exports.mulberry32 = mulberry32;
  exports.generateRandomManifest = generateRandomManifest;
  exports.getEcommerceManifest = getEcommerceManifest;
  exports.getFmcgManifest = getFmcgManifest;
  exports.getIndustrialManifest = getIndustrialManifest;
  exports.getIrregularManifest = getIrregularManifest;
  exports.getPalletManifest = getPalletManifest;
  exports.compareAlgorithms = compareAlgorithms;
  exports.buildManifest = buildManifest;
  exports.MAX_PER_TYPE = MAX_PER_TYPE;
  exports.getRandomSeed = () => currentRandomSeed;
  exports.setRandomSeed = (seed) => { currentRandomSeed = seed; };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
