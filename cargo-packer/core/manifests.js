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
   * Scenario 1: E-Commerce Express (Heterogeneous High-Variety Load)
   * 82 parcels with 7 distinct aspect ratios testing 3D void-filling and spatial packing.
   */
  function getEcommerceManifest() {
    const items = [];
    let id = 1;

    // A: Micro / Cosmetics Parcels (0.24 x 0.16 x 0.12 m, 1.2kg) - 16 units
    for (let i = 0; i < 16; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Micro Parcel', 0.24, 0.16, 0.12, 1.2, {
        color: '#38bdf8', // Cyan
        category: 'parcel',
        boxStyle: 'ecommerce'
      }));
    }

    // B: Shoebox style parcels (0.35 x 0.22 x 0.15 m, 2.5kg) - 18 units
    for (let i = 0; i < 18; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Shoebox Parcel', 0.35, 0.22, 0.15, 2.5, {
        color: '#a855f7', // Purple
        category: 'parcel',
        boxStyle: 'standard'
      }));
    }

    // C: Flat Mailers / Book packs (0.38 x 0.08 x 0.28 m, 2.0kg) - 14 units
    for (let i = 0; i < 14; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Flat Book Pack', 0.38, 0.08, 0.28, 2.0, {
        color: '#10b981', // Emerald
        category: 'parcel',
        boxStyle: 'ecommerce'
      }));
    }

    // D: Medium Shipping Boxes (0.45 x 0.35 x 0.30 m, 8kg) - 14 units
    for (let i = 0; i < 14; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Medium Carton', 0.45, 0.35, 0.30, 8, {
        color: '#c29b62', // Kraft cardboard tan
        category: 'carton',
        boxStyle: 'standard'
      }));
    }

    // E: Tall Tower Cartons (0.35 x 0.35 x 0.75 m, 12kg) - 8 units
    for (let i = 0; i < 8; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Tower Carton', 0.35, 0.35, 0.75, 12, {
        color: '#06b6d4', // Cyan-teal
        category: 'carton',
        boxStyle: 'standard'
      }));
    }

    // F: Large Appliance Cartons (0.60 x 0.50 x 0.45 m, 22kg) - 8 units
    for (let i = 0; i < 8; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Appliance Carton', 0.60, 0.50, 0.45, 22, {
        color: '#f59e0b', // Amber
        category: 'carton',
        boxStyle: 'heavy'
      }));
    }

    // G: Long Postal Tubes / Rug Rolls (0.22 x 0.22 x 1.20 m, 6kg) - 6 units
    for (let i = 0; i < 6; i++) {
      items.push(Types.createItem(`ec_${id++}`, 'Postal Cylinder', 0.22, 0.22, 1.20, 6, {
        color: '#ec4899', // Pink
        category: 'tube',
        boxStyle: 'standard'
      }));
    }

    return items;
  }

  /**
   * Scenario 2: FMCG Retail Distribution (Modular Interlocking Cartons)
   * Standard EUR-pallet modular footprint units (60x40, 40x30, 40x20 cm).
   */
  function getFmcgManifest() {
    const items = [];
    let id = 1;

    // Master Case A: 0.60 x 0.40 x 0.40 m, 18kg (EUR-pallet modular footprint) - 20 units
    for (let i = 0; i < 20; i++) {
      items.push(Types.createItem(`fmcg_${id++}`, 'Master Case A (60x40)', 0.60, 0.40, 0.40, 18, {
        color: '#0284c7', // Sky Blue
        category: 'carton',
        boxStyle: 'standard'
      }));
    }

    // Master Case B: 0.40 x 0.30 x 0.30 m, 10kg - 24 units
    for (let i = 0; i < 24; i++) {
      items.push(Types.createItem(`fmcg_${id++}`, 'Master Case B (40x30)', 0.40, 0.30, 0.30, 10, {
        color: '#6366f1', // Indigo
        category: 'carton',
        boxStyle: 'standard'
      }));
    }

    // Retail Pack C: 0.40 x 0.20 x 0.25 m, 5kg - 20 units
    for (let i = 0; i < 20; i++) {
      items.push(Types.createItem(`fmcg_${id++}`, 'Retail Pack C (40x20)', 0.40, 0.20, 0.25, 5, {
        color: '#14b8a6', // Teal
        category: 'carton',
        boxStyle: 'standard'
      }));
    }

    return items;
  }

  /**
   * Scenario 3: Industrial Machinery & Hazardous Freight
   * Heavy wooden crates, steel chemical drums, and fragile electronic equipment.
   */
  function getIndustrialManifest() {
    const items = [];
    let id = 1;

    // Heavy Generator Crates: 1.30 x 1.00 x 1.10 m, 900kg - 4 units
    for (let i = 0; i < 4; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Generator Crate', 1.30, 1.00, 1.10, 900, {
        color: '#b45309', // Wood Amber
        category: 'crate',
        boxStyle: 'wood_slat',
        allowedOrientations: 'this_side_up'
      }));
    }

    // Medium Machine Skids: 0.90 x 0.70 x 0.80 m, 450kg - 6 units
    for (let i = 0; i < 6; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Machine Skid', 0.90, 0.70, 0.80, 450, {
        color: '#92400e', // Dark wood
        category: 'crate',
        boxStyle: 'reinforced',
        allowedOrientations: 'this_side_up'
      }));
    }

    // Steel Chemical Drums: 0.60 x 0.90 x 0.60 m, 210kg - 12 units
    for (let i = 0; i < 12; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Steel Drum 200L', 0.60, 0.90, 0.60, 210, {
        color: i % 2 === 0 ? '#475569' : '#0284c7', // Steel Grey / Industrial Blue
        category: 'drum',
        boxStyle: 'drum',
        allowedOrientations: 'this_side_up'
      }));
    }

    // Tooling & Spares Crates: 0.75 x 0.45 x 0.50 m, 140kg - 10 units
    for (let i = 0; i < 10; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Spares Box', 0.75, 0.45, 0.50, 140, {
        color: '#0f766e', // Dark cyan
        category: 'crate',
        boxStyle: 'wood_slat'
      }));
    }

    // Fragile Electronic Instrument Packs: 0.45 x 0.30 x 0.35 m, 12kg - 12 units
    for (let i = 0; i < 12; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Fragile Electronics', 0.45, 0.30, 0.35, 12, {
        color: '#dc2626', // Safety Red
        category: 'carton',
        boxStyle: 'fragile',
        fragile: true,
        maxTopWeight: 20
      }));
    }

    // Valve & Pump Units: 0.50 x 0.40 x 0.40 m, 65kg - 8 units
    for (let i = 0; i < 8; i++) {
      items.push(Types.createItem(`ind_${id++}`, 'Pump Housing', 0.50, 0.40, 0.40, 65, {
        color: '#ea580c', // Tangerine
        category: 'carton',
        boxStyle: 'heavy'
      }));
    }

    return items;
  }

  /**
   * Scenario 4: Extreme Aspect Ratios (Slabs, Towers & Pipes)
   * Tests 6-way 3D rotational flexibility against flat, long, and tall items.
   */
  function getIrregularManifest() {
    const items = [];
    let id = 1;

    // A: Flat Screen / Solar Panel Slabs (0.95 x 0.12 x 0.70 m, 18kg) - 14 units
    for (let i = 0; i < 14; i++) {
      items.push(Types.createItem(`irr_${id++}`, 'Flat Display Panel', 0.95, 0.12, 0.70, 18, {
        color: '#8b5cf6', // Violet
        category: 'carton',
        boxStyle: 'fragile'
      }));
    }

    // B: Long Structural Beams / Skids (0.25 x 0.25 x 1.60 m, 42kg) - 8 units
    for (let i = 0; i < 8; i++) {
      items.push(Types.createItem(`irr_${id++}`, 'Long Timber Skid', 0.25, 0.25, 1.60, 42, {
        color: '#d97706', // Ochre
        category: 'crate',
        boxStyle: 'wood_slat'
      }));
    }

    // C: Server Rack / Telemetry Towers (0.45 x 0.45 x 1.10 m, 55kg) - 8 units
    for (let i = 0; i < 8; i++) {
      items.push(Types.createItem(`irr_${id++}`, 'Server Tower 24U', 0.45, 0.45, 1.10, 55, {
        color: '#0284c7', // Sky blue
        category: 'carton',
        boxStyle: 'heavy'
      }));
    }

    // D: Dense Heavy Cubes (0.35 x 0.35 x 0.35 m, 35kg) - 16 units
    for (let i = 0; i < 16; i++) {
      items.push(Types.createItem(`irr_${id++}`, 'Hardware Cube', 0.35, 0.35, 0.35, 35, {
        color: '#10b981', // Emerald
        category: 'carton',
        boxStyle: 'standard'
      }));
    }

    // E: Wide Flat Crates (0.80 x 0.22 x 0.80 m, 28kg) - 8 units
    for (let i = 0; i < 8; i++) {
      items.push(Types.createItem(`irr_${id++}`, 'Flat Equipment Crate', 0.80, 0.22, 0.80, 28, {
        color: '#b45309', // Wood
        category: 'crate',
        boxStyle: 'wood_slat'
      }));
    }

    return items;
  }

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
   * Scenario 6: Pallet Stacking Benchmark
   * Sized specifically for standard EUR-Pallet (1.2m x 0.8m x 1.8m).
   */
  function getPalletManifest() {
    const items = [];
    let id = 1;

    // Standard Carton 0.40 x 0.30 x 0.25 m - 18 units
    for (let i = 0; i < 18; i++) {
      items.push(Types.createItem(`pal_${id++}`, 'Export Carton', 0.40, 0.30, 0.25, 12, {
        color: '#0284c7',
        category: 'carton',
        boxStyle: 'standard'
      }));
    }

    // Half Carton 0.40 x 0.20 x 0.25 m - 14 units
    for (let i = 0; i < 14; i++) {
      items.push(Types.createItem(`pal_${id++}`, 'Half Carton', 0.40, 0.20, 0.25, 6, {
        color: '#f59e0b',
        category: 'carton',
        boxStyle: 'standard'
      }));
    }

    return items;
  }

  /**
   * Evaluates all 3 algorithms head-to-head on the given items and container.
   * Generates side-by-side volume metrics, winner ranking, and analytical insights.
   */
  function compareAlgorithms(items, container, options = {}) {
    const CP = (typeof module !== 'undefined' && module.exports) ? require('./extremePoints') : window.CargoPacker;
    const WB = (typeof module !== 'undefined' && module.exports) ? require('./wallBuilding') : window.CargoPacker;
    const FF = (typeof module !== 'undefined' && module.exports) ? require('./firstFit') : window.CargoPacker;

    const opt = Object.assign({ minSupportRatio: 0.60 }, options);

    const epResult = CP.packExtremePoints(items, container, opt);
    const wbResult = WB.packWallBuilding(items, container, opt);
    const ffResult = FF.packFirstFit(items, container, opt);

    const results = {
      extremePoints: {
        id: 'extremePoints',
        name: 'Extreme Points (EP)',
        shortName: 'Extreme Points',
        volumeUtilization: epResult.metrics.volumeUtilization,
        placedCount: epResult.placed.length,
        unplacedCount: epResult.unplaced.length,
        cargoVolume: epResult.metrics.cargoVolume,
        cargoWeight: epResult.metrics.cargoWeight,
        cogStatus: epResult.metrics.cog.status,
        result: epResult
      },
      wallBuilding: {
        id: 'wallBuilding',
        name: 'Wall-Building (Back-to-Front)',
        shortName: 'Wall-Building',
        volumeUtilization: wbResult.metrics.volumeUtilization,
        placedCount: wbResult.placed.length,
        unplacedCount: wbResult.unplaced.length,
        cargoVolume: wbResult.metrics.cargoVolume,
        cargoWeight: wbResult.metrics.cargoWeight,
        cogStatus: wbResult.metrics.cog.status,
        result: wbResult
      },
      firstFit: {
        id: 'firstFit',
        name: 'First-Fit Decreasing (Shelf)',
        shortName: 'First-Fit',
        volumeUtilization: ffResult.metrics.volumeUtilization,
        placedCount: ffResult.placed.length,
        unplacedCount: ffResult.unplaced.length,
        cargoVolume: ffResult.metrics.cargoVolume,
        cargoWeight: ffResult.metrics.cargoWeight,
        cogStatus: ffResult.metrics.cog.status,
        result: ffResult
      }
    };

    const ranking = ['extremePoints', 'wallBuilding', 'firstFit'];
    ranking.sort((a, b) => {
      if (Math.abs(results[b].volumeUtilization - results[a].volumeUtilization) > 0.1) {
        return results[b].volumeUtilization - results[a].volumeUtilization;
      }
      return results[b].placedCount - results[a].placedCount;
    });

    const winner = results[ranking[0]];
    const runnerUp = results[ranking[1]];
    const diff = (winner.volumeUtilization - runnerUp.volumeUtilization).toFixed(1);

    let insight = '';
    if (winner.id === 'extremePoints') {
      insight = `Extreme Points wins (+${diff}% volume). Its 3D corner projection seamlessly packs irregular recesses that break transverse wall slices.`;
    } else if (winner.id === 'wallBuilding') {
      insight = `Wall-Building wins (+${diff}% volume). Uniform modular depths align into solid vertical bulkheads with superior longitudinal stability.`;
    } else {
      insight = `First-Fit wins (+${diff}% volume) by efficiently tiering uniform height groups into dense horizontal layers.`;
    }

    return {
      results: results,
      winner: winner,
      ranking: ranking.map(id => results[id]),
      insight: insight
    };
  }

  const PRESETS = {
    ecommerce: {
      id: 'ecommerce',
      name: 'E-Commerce Mixed Parcels',
      description: '82 heterogeneous parcels across 7 size categories testing 3D void-filling.',
      containerId: 'iso20',
      getItems: getEcommerceManifest
    },
    fmcg: {
      id: 'fmcg',
      name: 'FMCG Retail Cartons',
      description: '64 modular interlocking grocery cartons with high volume fill potential.',
      containerId: 'iso20',
      getItems: getFmcgManifest
    },
    industrial: {
      id: 'industrial',
      name: 'Industrial Machinery & Drums',
      description: 'Heavy crates & chemical drums testing Center of Gravity & weight limits.',
      containerId: 'iso20',
      getItems: getIndustrialManifest
    },
    irregular: {
      id: 'irregular',
      name: 'Extreme Aspect Ratios',
      description: 'Flat panels, tall towers, and long skids testing 6-way 3D rotational flexibility.',
      containerId: 'iso20',
      getItems: getIrregularManifest
    },
    random: {
      id: 'random',
      name: 'Procedural Chaos (Random Sizes)',
      description: '70 randomized cartons, crates, and drums with random dimensions & weights.',
      containerId: 'iso20',
      isRandom: true,
      getItems: () => generateRandomManifest(currentRandomSeed, 70)
    },
    pallet: {
      id: 'pallet',
      name: 'EUR-Pallet Stacking',
      description: '32 cartons on standard 1.2m × 0.8m wooden base with zero overhang.',
      containerId: 'pallet',
      getItems: getPalletManifest
    }
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
  exports.getRandomSeed = () => currentRandomSeed;
  exports.setRandomSeed = (seed) => { currentRandomSeed = seed; };

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.CargoPacker = window.CargoPacker || {}));
