const canvas = document.getElementById('main');
const ctx    = canvas.getContext('2d');
const wrap   = document.getElementById('canvas-wrap');

const POLY_COLORS = ['#58a6ff','#3fb950','#f78166','#d2a8ff','#ffa657','#79c0ff','#56d364','#ff7b72','#e3b341','#a5d6ff'];

const DEFAULT_PAL = {
  skyTop:'#020617', skyMid:'#040b16', skyBot:'#051114',
  terrainFill:'#06101c', rockEdge:'#38bdf8',
  rockGlow:'rgba(56,189,248,', fog:'rgba(56,189,248,0.1)'
};

const COLOR_PRESETS = {
  'Grasslands (Level 1)': {
    skyTop: '#25338fff', skyMid: '#163158', skyBot: '#1f4e25',
    terrainFill: '#020802', rockEdge: '#4ade80',
    rockGlow: 'rgba(74,222,128,', fog: 'rgba(74,222,128,0.04)'
  },
  'Amber Dunes (Level 2)': {
    skyTop: '#1c0f03', skyMid: '#3a1f08', skyBot: '#5a2f0c',
    terrainFill: '#784620', rockEdge: '#fbbf24',
    rockGlow: 'rgba(251,191,36,', fog: 'rgba(217,119,6,0.08)'
  },
  'Deep Space (Level 3)': {
    skyTop: '#030712', skyMid: '#0b1b36', skyBot: '#132b4b',
    terrainFill: '#02050a', rockEdge: '#7dd3fc',
    rockGlow: 'rgba(125,211,252,', fog: 'rgba(125,211,252,0.06)'
  },
  'Magma Core (Level 4)': {
    skyTop: '#0e0403', skyMid: '#1a0602', skyBot: '#2a0a04',
    terrainFill: '#050100', rockEdge: '#f97316',
    rockGlow: 'rgba(249,115,22,', fog: 'rgba(249,115,22,0.08)'
  },
  'Nebulous Purple (Level 5)': {
    skyTop: '#040210', skyMid: '#080420', skyBot: '#0c0630',
    terrainFill: '#020108', rockEdge: '#a855f7',
    rockGlow: 'rgba(168,85,247,', fog: 'rgba(168,85,247,0.08)'
  },
  'Rust Wasteland (Level 6)': {
    skyTop: '#1a0e03', skyMid: '#3b1e08', skyBot: '#5c3012',
    terrainFill: '#0a0401', rockEdge: '#d97706',
    rockGlow: 'rgba(217,119,6,', fog: 'rgba(180,90,6,0.12)'
  },
  'Frozen Planet (Level 7)': {
    skyTop: '#020617', skyMid: '#040b16', skyBot: '#051114',
    terrainFill: '#010204', rockEdge: '#38bdf8',
    rockGlow: 'rgba(56,189,248,', fog: 'rgba(56,189,248,0.1)'
  },
  'Synthwave (Level 8)': {
    skyTop: '#050110', skyMid: '#0c0420', skyBot: '#140430',
    terrainFill: '#03010a', rockEdge: '#a855f7',
    rockGlow: 'rgba(168,85,247,', fog: 'rgba(244,114,182,0.08)'
  },
  'Acid Swamp (Level 9)': {
    skyTop: '#050107', skyMid: '#0c0410', skyBot: '#14040a',
    terrainFill: '#020102', rockEdge: '#34d399',
    rockGlow: 'rgba(52,211,153,', fog: 'rgba(239,68,68,0.06)'
  },
  'Glacial Chasm (Level 10)': {
    skyTop: '#020617', skyMid: '#040b16', skyBot: '#051114',
    terrainFill: '#010204', rockEdge: '#06b6d4',
    rockGlow: 'rgba(6,182,212,', fog: 'rgba(6,182,212,0.1)'
  },
  'Default Sandbox': {
    skyTop: '#04071a', skyMid: '#060d1f', skyBot: '#0a1628',
    terrainFill: '#020408', rockEdge: '#38bdf8',
    rockGlow: 'rgba(56,189,248,', fog: 'rgba(56,189,248,0.04)'
  },
  'Slate Monochromatic': {
    skyTop: '#0f172a', skyMid: '#1e293b', skyBot: '#334155',
    terrainFill: '#020617', rockEdge: '#f1f5f9',
    rockGlow: 'rgba(241,245,249,', fog: 'rgba(241,245,249,0.05)'
  },
  'Solar Eclipse': {
    skyTop: '#0b0805', skyMid: '#1c120a', skyBot: '#2d1c0f',
    terrainFill: '#040201', rockEdge: '#f59e0b',
    rockGlow: 'rgba(245,158,11,', fog: 'rgba(245,158,11,0.08)'
  },
  'Bioluminescent Abyssal': {
    skyTop: '#021013', skyMid: '#041d24', skyBot: '#062d35',
    terrainFill: '#010709', rockEdge: '#06b6d4',
    rockGlow: 'rgba(6,182,212,', fog: 'rgba(6,182,212,0.06)'
  },
  'Cyberpunk Grid': {
    skyTop: '#050005', skyMid: '#0c000c', skyBot: '#150015',
    terrainFill: '#000000', rockEdge: '#ff007f',
    rockGlow: 'rgba(255,0,127,', fog: 'rgba(0,240,255,0.08)'
  },
  'Forest Canopy': {
    skyTop: '#081408', skyMid: '#0f240f', skyBot: '#183818',
    terrainFill: '#040a04', rockEdge: '#84cc16',
    rockGlow: 'rgba(132,204,22,', fog: 'rgba(132,204,22,0.06)'
  },
  'Crimson Horizon': {
    skyTop: '#2d0606', skyMid: '#4c0b0b', skyBot: '#6d1010',
    terrainFill: '#0a0101', rockEdge: '#ef4444',
    rockGlow: 'rgba(239,68,68,', fog: 'rgba(239,68,68,0.07)'
  },
  'Ice & Fire': {
    skyTop: '#040d1a', skyMid: '#08172e', skyBot: '#0d2547',
    terrainFill: '#02060e', rockEdge: '#f97316',
    rockGlow: 'rgba(249,115,22,', fog: 'rgba(249,115,22,0.08)'
  },
  'Royal Violet': {
    skyTop: '#080518', skyMid: '#120b33', skyBot: '#1d1252',
    terrainFill: '#04020a', rockEdge: '#eab308',
    rockGlow: 'rgba(234,179,8,', fog: 'rgba(234,179,8,0.05)'
  },
  'Toxic Spill': {
    skyTop: '#10021a', skyMid: '#1d0430', skyBot: '#290642',
    terrainFill: '#05000a', rockEdge: '#22c55e',
    rockGlow: 'rgba(34,197,94,', fog: 'rgba(234,179,8,0.1)'
  },
  'Muted Vintage': {
    skyTop: '#1e1c1e', skyMid: '#2d282d', skyBot: '#3d343d',
    terrainFill: '#151315', rockEdge: '#fda4af',
    rockGlow: 'rgba(253,164,175,', fog: 'rgba(254,240,138,0.06)'
  }
};

// ── Color helpers for the Palette panel ─────────────────────────────────────
// rockGlow/fog are stored as (partial) rgba() strings rather than plain hex —
// rockGlow because render call sites append their own alpha, fog because it
// needs one. These convert between that storage format and the hex + alpha
// controls the UI exposes, and back.
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:56, g:189, b:248 };
}
function rgbToHex(r, g, b) {
  const h = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
function rgbToHsl(r, g, b) {
  r/=255; g/=255; b/=255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g-b)/d + (g<b ? 6 : 0); break;
      case g: h = (b-r)/d + 2; break;
      default: h = (r-g)/d + 4;
    }
    h /= 6;
  }
  return { h: h*360, s: s*100, l: l*100 };
}
function hslToHex(h, s, l) {
  h/=360; s/=100; l/=100;
  const a = s * Math.min(l, 1-l);
  const f = n => { const k = (n + h*12) % 12; return l - a * Math.max(-1, Math.min(k-3, Math.min(9-k, 1))); };
  return rgbToHex(f(0)*255, f(8)*255, f(4)*255);
}
// Parses the PARTIAL rgba() string rockGlow uses, e.g. "rgba(56,189,248,".
function parseRgbaPrefix(str) {
  const m = /rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*$/.exec(str || '');
  return m ? { r:+m[1], g:+m[2], b:+m[3] } : hexToRgb('#38bdf8');
}
// Parses a complete rgba() string, e.g. "rgba(56,189,248,0.1)".
function parseRgba(str) {
  const m = /rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/.exec(str || '');
  return m ? { r:+m[1], g:+m[2], b:+m[3], a:+m[4] } : { ...hexToRgb('#38bdf8'), a:0.1 };
}

function renderSwatches(pal) {
  const parseColor = (col, fallback) => {
    if (!col) return fallback;
    if (col.startsWith('#')) return col.slice(0, 7);
    if (col.startsWith('rgba')) {
      const m = /rgba\(\s*(\d+),\s*(\d+),\s*(\d+),/.exec(col);
      return m ? `rgb(${m[1]},${m[2]},${m[3]})` : fallback;
    }
    return col;
  };
  const c1 = parseColor(pal.skyTop, '#000');
  const c2 = parseColor(pal.skyMid, '#000');
  const c3 = parseColor(pal.skyBot, '#000');
  const c4 = parseColor(pal.terrainFill, '#000');
  const c5 = parseColor(pal.rockEdge, '#fff');

  return `<div class="preset-swatch-row">
    <div class="preset-swatch" style="background:${c1}" title="Sky Top"></div>
    <div class="preset-swatch" style="background:${c2}" title="Sky Mid"></div>
    <div class="preset-swatch" style="background:${c3}" title="Sky Bot"></div>
    <div class="preset-swatch" style="background:${c4}" title="Terrain"></div>
    <div class="preset-swatch" style="background:${c5}" title="Rock Edge"></div>
  </div>`;
}

function applyPalettePreset(name) {
  snapshot();
  if (name && COLOR_PRESETS[name]) {
    S.palette = Object.assign({}, COLOR_PRESETS[name]);
  }
  populatePaletteUI();
  draw(); updateOut();
}

// Close custom dropdown on click outside
window.addEventListener('click', function(e) {
  if (!e.target.closest('.preset-dropdown')) {
    const container = document.getElementById('preset-dropdown-container');
    if (container) container.classList.remove('open');
  }
});

// Derives a full 7-key palette from a single accent color: dark, medium, or light
// saturation/lightness sky and terrain shades plus the accent itself.
function generatePaletteFromBase(hex, mode = 'dark') {
  snapshot();
  const { r, g, b } = hexToRgb(hex);
  const { h } = rgbToHsl(r, g, b);
  
  if (mode === 'light') {
    S.palette.skyTop      = hslToHex(h, 60, 65);
    S.palette.skyMid      = hslToHex(h, 55, 78);
    S.palette.skyBot      = hslToHex(h, 50, 88);
    S.palette.terrainFill = hslToHex(h, 45, 30);
    S.palette.fog         = `rgba(${r},${g},${b},0.04)`;
  } else if (mode === 'medium') {
    S.palette.skyTop      = hslToHex(h, 50, 18);
    S.palette.skyMid      = hslToHex(h, 45, 30);
    S.palette.skyBot      = hslToHex(h, 40, 42);
    S.palette.terrainFill = hslToHex(h, 45, 12);
    S.palette.fog         = `rgba(${r},${g},${b},0.06)`;
  } else { // dark
    S.palette.skyTop      = hslToHex(h, 45, 8);
    S.palette.skyMid      = hslToHex(h, 40, 15);
    S.palette.skyBot      = hslToHex(h, 35, 22);
    S.palette.terrainFill = hslToHex(h, 40, 5);
    S.palette.fog         = `rgba(${r},${g},${b},0.08)`;
  }
  
  S.palette.rockEdge    = rgbToHex(r, g, b);
  S.palette.rockGlow    = `rgba(${r},${g},${b},`;
  
  populatePaletteUI();
  draw(); updateOut();
}
function setRockGlowColor(hex) {
  snapshot();
  const { r, g, b } = hexToRgb(hex);
  S.palette.rockGlow = `rgba(${r},${g},${b},`;
  draw(); updateOut();
}
function setFogColor(hex) {
  snapshot();
  const { a } = parseRgba(S.palette.fog);
  const { r, g, b } = hexToRgb(hex);
  S.palette.fog = `rgba(${r},${g},${b},${a})`;
  draw(); updateOut();
}
function setFogAlpha(a) {
  snapshot();
  const { r, g, b } = parseRgba(S.palette.fog);
  S.palette.fog = `rgba(${r},${g},${b},${a})`;
  draw(); updateOut();
}

// Metadata fields whose values live outside S.cfg (S.startX / S.padScale /
// the Entities panel's hq-*/cargo-* inputs) even though they're described in
// LEVEL_SCHEMA.fields alongside the rest of the mission params — skipped
// wherever the Metadata panel is built/read/exported from the schema.
const META_EXCLUDE_KEYS = ['startX', 'startY', 'startDepotWidth', 'collectionX', 'collectionY', 'collectionWidth'];

function defaultCfgFromSchema() {
  const o = {};
  LEVEL_SCHEMA.fields.forEach(f => {
    if (META_EXCLUDE_KEYS.includes(f.key)) return;
    o[f.key] = Array.isArray(f.default) ? f.default.slice() : f.default;
  });
  return o;
}

// Builds the onchange handler expression for a schema field's generated
// <input>/<select>, matching how setCfg()/setOOB() already expect to
// be called (raw string for text/select, coerced number, or .checked).
function schemaOnchangeExpr(setterName, field) {
  if (field.widget === 'checkbox') return `${setterName}('${field.key}', this.checked)`;
  if (field.type === 'number' || field.type === 'integer') return `${setterName}('${field.key}', +this.value)`;
  return `${setterName}('${field.key}', this.value)`;
}

// Builds one <div class="row"> for a schema field, sharing the same widget
// logic (text/number/checkbox/color/select) across the Metadata/OOB/Gravity
// Well panels.
function schemaFieldRowHTML(setterName, idPrefix, field) {
  const id = idPrefix + field.key;
  const onchange = schemaOnchangeExpr(setterName, field);
  let input;
  if (field.key === 'allowedTypes') {
    const cargoTypes = ['normal', 'red', 'blue', 'green', 'tethered', 'heavy'];
    input = `<div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; flex:1;">` +
      cargoTypes.map(t => {
        return `<label style="display:inline-flex; align-items:center; gap:4px; width:auto; font-size:12px; margin-bottom:0; cursor:pointer; color:#c9d1d9; font-weight:normal;">
          <input type="checkbox" class="cfg-allowed-type-checkbox" value="${t}" onchange="updateAllowedTypes()"> ${t}
        </label>`;
      }).join('') + `</div>`;
  } else if (field.widget === 'checkbox') {
    input = `<input type="checkbox" id="${id}" onchange="${onchange}">`;
  } else if (field.widget === 'select') {
    const opts = field.options.map(o => `<option value="${o}">${o || '(none)'}</option>`).join('');
    input = `<select id="${id}" onchange="${onchange}">${opts}</select>`;
  } else if (field.widget === 'color') {
    input = `<input type="color" id="${id}" onchange="${onchange}">`;
  } else {
    const stepAttr = field.step != null ? ` step="${field.step}"` : '';
    const inputType = (field.type === 'number' || field.type === 'integer') ? 'number' : 'text';
    const hasSlider = field.sliderMin != null && field.sliderMax != null;
    const numberOnchange = hasSlider
      ? `${onchange}; const _r=document.getElementById('${id}-r'); if(_r) _r.value=this.value;`
      : onchange;
    const numberInput = `<input type="${inputType}" id="${id}"${stepAttr} onchange="${numberOnchange}">`;
    if (hasSlider) {
      let sliderMin = field.sliderMin;
      let sliderMax = field.sliderMax;
      if (field.key === 'ambientTrafficMinY' || field.key === 'ambientTrafficMaxY') {
        const defaults = getTrafficDefaults();
        const span = Math.max(1000, defaults.defMax - defaults.defMin);
        sliderMin = Math.round(defaults.defMin - span);
        sliderMax = Math.round(defaults.defMax + span);
      }
      const sliderStep = field.sliderStep ?? field.step ?? 1;
      const sliderOninput = `document.getElementById('${id}').value=this.value; ${setterName}('${field.key}', +this.value)`;
      input = `<div class="slider-combo">${numberInput}<input type="range" class="field-slider" id="${id}-r" min="${sliderMin}" max="${sliderMax}" step="${sliderStep}" oninput="${sliderOninput}"></div>`;
    } else {
      input = numberInput;
    }
  }
  
  const parts = [];
  if (field.desc) parts.push(field.desc);
  if (field.recommended) parts.push('Recommended: ' + field.recommended);
  parts.push('Default: ' + formatFieldDefault(field));
  const tooltipHTML = `<span class="tooltip-icon" title="${parts.join('&#13;&#10;')}">?</span>`;

  return `<div class="row"><label>${field.label}${tooltipHTML}</label>${input}</div>`;
}

// Renders a field's schema `default` for the tooltip — null/undefined read
// as "none" (e.g. shadowAngle, which falls back to computed terrain-relative
// values rather than a fixed number) rather than the literal word "null".
function formatFieldDefault(field) {
  const d = field.default;
  if (d === null || d === undefined) return 'none';
  if (Array.isArray(d)) return d.length ? d.join(', ') : 'none';
  if (typeof d === 'boolean') return d ? 'true' : 'false';
  if (d === '') return '(empty)';
  return String(d);
}

function buildMetaPanel() {
  const fields = LEVEL_SCHEMA.fields.filter(f => !META_EXCLUDE_KEYS.includes(f.key));
  
  const sections = {
    info: ['name', 'missionTitle', 'description', 'hint'],
    objectives: ['targetCargo', 'allowedTypes', 'heavyCargo'],
    weather: ['weather', 'heatHaze', 'gravity', 'wind', 'windVarianceEnabled', 'windVarianceAmount', 'windVarianceSpeed'],
    looksTop: ['backgroundType', 'night'],
    looksBottom: ['shadowAngle', 'shadowLength'],
    rules: ['deposit', 'timeLimit', 'padScale', 'terrainType'],
    traffic: ['ambientTrafficRate', 'ambientTrafficSpeed', 'ambientTrafficMinY', 'ambientTrafficMaxY']
  };

  document.getElementById('info-panel').innerHTML = fields
    .filter(f => sections.info.includes(f.key))
    .map(f => schemaFieldRowHTML('setCfg', 'cfg-', f)).join('');

  document.getElementById('objectives-panel').innerHTML = fields
    .filter(f => sections.objectives.includes(f.key))
    .map(f => schemaFieldRowHTML('setCfg', 'cfg-', f)).join('');

  document.getElementById('weather-panel').innerHTML = fields
    .filter(f => sections.weather.includes(f.key))
    .map(f => schemaFieldRowHTML('setCfg', 'cfg-', f)).join('');

  document.getElementById('looks-panel-top').innerHTML = fields
    .filter(f => sections.looksTop.includes(f.key))
    .map(f => schemaFieldRowHTML('setCfg', 'cfg-', f)).join('');

  document.getElementById('looks-panel-bottom').innerHTML = fields
    .filter(f => sections.looksBottom.includes(f.key))
    .map(f => schemaFieldRowHTML('setCfg', 'cfg-', f)).join('');

  document.getElementById('rules-panel').innerHTML = fields
    .filter(f => sections.rules.includes(f.key))
    .map(f => schemaFieldRowHTML('setCfg', 'cfg-', f)).join('');

  document.getElementById('traffic-panel').innerHTML = fields
    .filter(f => sections.traffic.includes(f.key))
    .map(f => schemaFieldRowHTML('setCfg', 'cfg-', f)).join('');
}

function buildOOBPanel() {
  document.getElementById('oob-fields').innerHTML = LEVEL_SCHEMA.outOfBounds.fields
    .map(f => schemaFieldRowHTML('setOOB', 'oob-', f)).join('');
}
function buildWorldBoundsPanel() {
  document.getElementById('world-bounds-fields').innerHTML = LEVEL_SCHEMA.worldBounds.fields
    .map(f => schemaFieldRowHTML('setWorldBounds', 'wb-', f)).join('');
}

function buildGWPanel() {
}
function buildRadarPanel() {
  document.getElementById('rpz-fields').innerHTML = LEVEL_SCHEMA.radarPingZone.fields
    .map(f => schemaFieldRowHTML('setRadarZone', 'rpz-', f)).join('');
}
function buildWindGustPanel() {
  document.getElementById('windgust-fields').innerHTML = LEVEL_SCHEMA.windGust.fields
    .map(f => schemaFieldRowHTML('setWindGust', 'windgust-', f)).join('');
}

const _undoStack = [];
const _redoStack = [];

function snapshot() {
  _undoStack.push(JSON.stringify(S));
  if (_undoStack.length > 50) _undoStack.shift();
  _redoStack.length = 0;
}

function undo() {
  if (!_undoStack.length) return;
  _redoStack.push(JSON.stringify(S));
  S = JSON.parse(_undoStack.pop());
  _restoreState();
}

function redo() {
  if (!_redoStack.length) return;
  _undoStack.push(JSON.stringify(S));
  S = JSON.parse(_redoStack.pop());
  _restoreState();
}

function _restoreState() {
  syncLayerButtonsUI();
  populatePaletteUI();
  buildMetaPanel();
  buildOOBPanel();
  buildWorldBoundsPanel();
  buildGWPanel();
  buildRadarPanel();
  buildWindGustPanel();
  if (typeof updateEntityPanel === 'function') updateEntityPanel();
  if (typeof updateHubUI === 'function') updateHubUI();
  if (typeof renderCollectibleAddRow === 'function') renderCollectibleAddRow();
  if (typeof updateCollectibleUI === 'function') updateCollectibleUI();
  renderSidebar();
  renderPtList();
  draw();
  updateOut();
}

let S = {
  // All three shape lists share the same per-item shape: {pts:[{x,y}], comment:'', hidden:false, ...extra}
  // extra: water items also have `hasBoat`; hazard items also have `type`.
  polygons: [],    // terrain
  waterPolys: [],  // water bodies
  hazardPolys: [], // hazards
  segments: [],   // [{x1,y1,x2,y2}]
  hubs: [],       // [{x, width?, color, type, name}]
  collectibles: [], // [{type, x, y, ...amountField}] — see levels/collectibleTypes.js
  gravWell: null, // {x,y,radius,orbitRadius,strength}
  radarZone: null, // {cx,cy,r,color,period} — purely visual sonar-ring overlay
  windGust: null, // {calm,warn,gust,gustMult} — optional calm/warning/gust wind cycle
  oob: null,      // {type,color,mistColor,surfaceY,drag,buoyancy} — the fluid zone
  worldBounds: null, // {ceilingY,ceilingAction,leftMargin,rightMargin,lateralAction,bottomY,bottomAction}
  palette: Object.assign({}, DEFAULT_PAL),
  startX: 0,
  startY: null,
  collectionX: null,
  collectionY: null,
  padScale: 1,

  cfg: defaultCfgFromSchema(),
  quests: { primary: '', nocrash: false, nocargo: false, quick: null, worm: false },
  hqWidth: null,
  cargoWidth: null,

  levelName: '',
  selLayer: 'terrain', // 'terrain' | 'water' | 'hazard' — which shape list is being edited
  selPoly: -1,         // index within the active layer's list
  selPt: -1,
  dragging: false, dragLayer: null, dragPi: -1, dragPti: -1,
  dragMarker: null,  // 'hq' | 'depot' | {hub:i} — dragging a spawn/hub marker
  dragPolyBody: null, // {layer,pi,startWx,startWy,origPts} — dragging whole polygon body
  edgePreview: null, // {layer, pi, edgeIdx, pt} — shown in Add pts mode on hover
  hoverMarker: null, // 'hq' | 'depot' | {hub:i} — for cursor feedback
  mode: 'select',
  previewMode: false,
  snap: 10,
  view: { x:200, y:150, scale:0.35 },
  mouse: { wx:0, wy:0 },
};

buildMetaPanel();
buildOOBPanel();
buildWorldBoundsPanel();
buildGWPanel();
buildRadarPanel();
buildWindGustPanel();

// ── Shape-layer helpers (terrain / water / hazard share the same editing code) ─
function listForLayer(layer) {
  return layer === 'water' ? S.waterPolys : layer === 'hazard' ? S.hazardPolys : layer === 'segments' ? S.segments : S.polygons;
}
function activeList() { return listForLayer(S.selLayer); }
function syncLayerButtonsUI() {
  ['terrain','water','hazard','segments'].forEach(l => document.getElementById('lyr-'+l).className = 'btn'+(l===S.selLayer?' on':''));
  document.getElementById('add-shape-btn').textContent = '+ Add ' + (S.selLayer.charAt(0).toUpperCase() + S.selLayer.slice(1));
}
function setLayer(layer) {
  S.selLayer = layer;
  S.selPoly = activeList().length ? 0 : -1;
  S.selPt = -1;
  syncLayerButtonsUI();
  renderSidebar(); draw();
}


function setCfg(key, val) {
  snapshot();
  if (key === 'allowedTypes') {
    S.cfg.allowedTypes = Array.isArray(val) ? val : val.split(',').map(s=>s.trim()).filter(Boolean);
  } else if (key === 'padScale') {
    S.padScale = val;
  } else {
    S.cfg[key] = val;
  }
  if (key === 'ambientTrafficMinY' || key === 'ambientTrafficMaxY') {
    enforceTrafficYOrder(key);
  }
  updateOut();
  draw();
}

// Traffic Min Y must stay <= Traffic Max Y (min = top of band, max = bottom).
// When the user drags one past the other, push the other field's value to
// match and keep its number+slider DOM inputs in sync.
function enforceTrafficYOrder(changedKey) {
  const otherKey = changedKey === 'ambientTrafficMinY' ? 'ambientTrafficMaxY' : 'ambientTrafficMinY';
  const changedVal = S.cfg[changedKey];
  const otherVal = S.cfg[otherKey];
  if (changedVal == null || otherVal == null) return;
  const violates = changedKey === 'ambientTrafficMinY' ? changedVal > otherVal : changedVal < otherVal;
  if (!violates) return;
  S.cfg[otherKey] = changedVal;
  const id = 'cfg-' + otherKey;
  const numEl = document.getElementById(id);
  const sliderEl = document.getElementById(id + '-r');
  if (numEl) numEl.value = changedVal;
  if (sliderEl) sliderEl.value = changedVal;
}

function updateAllowedTypes() {
  snapshot();
  const selected = [];
  document.querySelectorAll('.cfg-allowed-type-checkbox').forEach(cb => {
    if (cb.checked) selected.push(cb.value);
  });
  setCfg('allowedTypes', selected);
}

function toggleOOB() {
  snapshot();
  const en = document.getElementById('oob-enable').checked;
  document.getElementById('oob-fields').style.display = en ? 'flex' : 'none';
  document.getElementById('oob-preset-row').style.display = en ? 'block' : 'none';
  if (en && !S.oob) {
    S.oob = {};
    LEVEL_SCHEMA.outOfBounds.fields.forEach(f => S.oob[f.key] = f.default);
    S.oobIsBoolean = false;
  } else if (!en) { S.oob = null; S.oobIsBoolean = false; }
  syncAllSliders();
  draw(); updateOut();
}

const OOB_PRESETS = {
  water: { type: 'water', color: '#1d4ed8', mistColor: '#3b82f6', drag: 0.02, buoyancy: 0.05 },
  goo: { type: 'goo', color: '#064e3b', mistColor: '#10b981', drag: 0.04, buoyancy: 0.06 },
  lava: { type: 'acid', color: '#7c2d12', mistColor: '#f97316', drag: 0.05, buoyancy: 0.04 },
  sand: { type: 'sand', color: '#78350f', mistColor: '#d97706', drag: 0.12, buoyancy: 0.00 },
  void: { type: 'void', color: '#030712', mistColor: '#1e1b4b', drag: 0.00, buoyancy: 0.00 }
};

function applyOOBPreset(presetKey) {
  snapshot();
  if (!presetKey || !OOB_PRESETS[presetKey]) return;
  const p = OOB_PRESETS[presetKey];
  if (!S.oob) {
    S.oob = {};
  }
  Object.assign(S.oob, p);
  
  // Update fields in UI
  document.getElementById('oob-type').value = S.oob.type;
  document.getElementById('oob-color').value = S.oob.color;
  document.getElementById('oob-mistColor').value = S.oob.mistColor;
  document.getElementById('oob-drag').value = S.oob.drag;
  document.getElementById('oob-buoyancy').value = S.oob.buoyancy;
  
  syncAllSliders();
  draw(); updateOut();
}

// Editing any field means the level now needs the full object form, so this
// also clears S.oobIsBoolean — see applyConfig()'s comment for why that flag
// exists (preserving the `outOfBounds: true` shorthand some levels use).
function setOOB(k, v) { snapshot(); if (S.oob) { S.oob[k] = v; S.oobIsBoolean = false; } draw(); updateOut(); }

function updateHubCoords() {
  S.hubs.forEach((h, i) => {
    const elX = document.getElementById(`hub-${i}-x`);
    const elY = document.getElementById(`hub-${i}-y`);
    if (elX) elX.value = h.x;
    if (elY) elY.value = h.y != null ? h.y : '';
  });
}


function toggleRadarZone() {
  snapshot();
  const en = document.getElementById('rpz-enable').checked;
  document.getElementById('rpz-fields').style.display = en ? 'flex' : 'none';
  if (en && !S.radarZone) {
    S.radarZone = {};
    LEVEL_SCHEMA.radarPingZone.fields.forEach(f => S.radarZone[f.key] = f.default);
  } else if (!en) S.radarZone = null;
  syncAllSliders();
  draw(); updateOut();
}
function setRadarZone(k, v) { snapshot(); if (S.radarZone) { S.radarZone[k] = v; } draw(); updateOut(); }

function toggleWindGust() {
  snapshot();
  const en = document.getElementById('windgust-enable').checked;
  document.getElementById('windgust-fields').style.display = en ? 'flex' : 'none';
  if (en && !S.windGust) {
    S.windGust = {};
    LEVEL_SCHEMA.windGust.fields.forEach(f => S.windGust[f.key] = f.default);
  } else if (!en) S.windGust = null;
  syncAllSliders();
  draw(); updateOut();
}
function setWindGust(k, v) { snapshot(); if (S.windGust) { S.windGust[k] = v; } draw(); updateOut(); }

function toggleWorldBounds() {
  snapshot();
  const en = document.getElementById('wb-enable').checked;
  document.getElementById('world-bounds-fields').style.display = en ? 'flex' : 'none';
  if (en && !S.worldBounds) {
    S.worldBounds = {};
    LEVEL_SCHEMA.worldBounds.fields.forEach(f => {
      S.worldBounds[f.key] = f.default;
      const el = document.getElementById('wb-' + f.key);
      if (el) el.value = f.default ?? '';
    });
  } else if (!en) { S.worldBounds = null; }
  syncAllSliders();
  draw(); updateOut();
}
function setWorldBounds(k, v) { snapshot(); if (S.worldBounds) { S.worldBounds[k] = v; } draw(); updateOut(); }

// --- Terrain Manipulation ---
function setQuest(k, v) { snapshot(); S.quests[k] = v; updateOut(); }

function updateHubUI() {
  const c = document.getElementById('hub-list');
  c.innerHTML = '';
  S.hubs.forEach((h, i) => {
    const d = document.createElement('div');
    d.className = 'props-panel';
    d.style.border = '1px solid #30363d'; d.style.padding = '4px'; d.style.borderRadius = '4px';
    d.innerHTML = `
      <div class="row">
        <span style="font-size:10px;color:#8b949e;width:20px">${i}</span>
        <label style="width:30px">Name</label><input type="text" value="${h.name||''}" onchange="snapshot(); S.hubs[${i}].name=this.value; updateOut()">
        <button class="btn del" style="padding:0 5px;margin-left:4px" onclick="snapshot(); S.hubs.splice(${i},1); updateHubUI(); draw(); updateOut()">×</button>
      </div>
      <div class="row">
        <label style="width:30px">Type</label><input type="text" style="width:40px" value="${h.type||''}" onchange="snapshot(); S.hubs[${i}].type=this.value; draw(); updateOut()">
        <label style="width:20px;margin-left:4px">X</label><input type="number" id="hub-${i}-x" style="width:50px" value="${h.x}" onchange="snapshot(); S.hubs[${i}].x=+this.value; draw(); updateOut()">
        <label style="width:20px;margin-left:4px">Y</label><input type="number" id="hub-${i}-y" style="width:45px" placeholder="auto" value="${h.y != null ? h.y : ''}" onchange="snapshot(); S.hubs[${i}].y=(this.value === '' ? null : +this.value); draw(); updateOut()">
        <input type="color" style="margin-left:4px" title="Hub color" value="${h.color||'#ffd700'}" onchange="snapshot(); S.hubs[${i}].color=this.value; draw(); updateOut()">
      </div>
      <div class="row">
        <label style="width:30px" title="Visual structure drawn behind the pad in-game. 'crane' is the classic yellow crane; house/depot/silo are background buildings; 'none' is a bare pad. (A hub with type 'chute' always renders as a vacuum chute.)">Style</label>
        <select style="flex:1" onchange="setHubStyle(${i}, this.value)">${HUB_STYLES.map(s=>`<option value="${s}" ${(h.style||'crane')===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
    `;
    c.appendChild(d);
  });
}

// ── Collectibles (mid-air flythrough pickups) ──────────────────────────────
// Types come from the shared registry (levels/collectibleTypes.js) so adding
// a new pickup type doesn't require touching the editor at all.
function renderCollectibleAddRow() {
  const row = document.getElementById('collectible-add-row');
  if (!row || !window.COLLECTIBLE_TYPE_LIST) return;
  row.innerHTML = window.COLLECTIBLE_TYPE_LIST.map(t => {
    const def = window.COLLECTIBLE_TYPES[t];
    return `<button class="btn" onclick="addCollectible('${t}')">+ ${def.label}</button>`;
  }).join('');
}

function addCollectible(type) {
  snapshot();
  const def = window.COLLECTIBLE_TYPES[type];
  const item = { type, x: snap(S.mouse.wx || 500), y: snap(S.mouse.wy || 400) };
  item[def.amountField] = def.defaultAmount;
  S.collectibles.push(item);
  updateCollectibleUI(); draw(); updateOut();
}

function updateCollectibleCoords() {
  S.collectibles.forEach((c, i) => {
    const elX = document.getElementById(`coll-${i}-x`);
    const elY = document.getElementById(`coll-${i}-y`);
    if (elX) elX.value = c.x;
    if (elY) elY.value = c.y;
  });
}

function updateCollectibleUI() {
  const c = document.getElementById('collectible-list');
  if (!c) return;
  c.innerHTML = '';
  S.collectibles.forEach((item, i) => {
    const def = window.COLLECTIBLE_TYPES[item.type] || {};
    const d = document.createElement('div');
    d.className = 'props-panel';
    d.style.border = '1px solid #30363d'; d.style.padding = '4px'; d.style.borderRadius = '4px';
    d.innerHTML = `
      <div class="row">
        <span style="font-size:10px;color:#8b949e;width:20px">${i}</span>
        <span style="width:40px;font-size:11px;color:${def.color||'#fff'}">${def.label||item.type}</span>
        <button class="btn del" style="padding:0 5px;margin-left:auto" onclick="snapshot(); S.collectibles.splice(${i},1); updateCollectibleUI(); draw(); updateOut()">×</button>
      </div>
      <div class="row">
        <label style="width:20px">X</label><input type="number" id="coll-${i}-x" style="width:50px" value="${item.x}" onchange="snapshot(); S.collectibles[${i}].x=+this.value; draw(); updateOut()">
        <label style="width:20px;margin-left:4px">Y</label><input type="number" id="coll-${i}-y" style="width:50px" value="${item.y}" onchange="snapshot(); S.collectibles[${i}].y=+this.value; draw(); updateOut()">
        <label style="width:50px;margin-left:4px" title="${def.amountField||'amount'}">${def.amountField||'amount'}</label><input type="number" style="width:55px" value="${item[def.amountField]!=null?item[def.amountField]:def.defaultAmount}" onchange="snapshot(); S.collectibles[${i}]['${def.amountField}']=+this.value; updateOut()">
      </div>
    `;
    c.appendChild(d);
  });
}

const HUB_STYLES = ['crane','house','depot','silo','repair','none'];
function setHubStyle(i, v) {
  snapshot();
  // 'crane' is the renderer default — omit it so exports stay minimal
  if (v === 'crane') delete S.hubs[i].style;
  else S.hubs[i].style = v;
  draw(); updateOut();
}

function populatePaletteUI() {
  const p = document.getElementById('palette-panel');
  const baseHex = S.palette.rockEdge || '#38bdf8';

  let matchedPreset = '';
  for (const [name, pal] of Object.entries(COLOR_PRESETS)) {
    let match = true;
    for (const key of Object.keys(pal)) {
      if (S.palette[key] !== pal[key]) {
        match = false;
        break;
      }
    }
    if (match) {
      matchedPreset = name;
      break;
    }
  }

  const triggerLabel = matchedPreset ? matchedPreset : '-- Custom / Base Derived --';
  const triggerSwatches = matchedPreset ? renderSwatches(COLOR_PRESETS[matchedPreset]) : renderSwatches(S.palette);

  S.paletteGenMode = S.paletteGenMode || 'dark';
  const genMode = S.paletteGenMode;

  let html = `<div class="row" style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #30363d">
    <label title="Select a curated color theory preset or existing level theme.">Preset</label>
    <div class="preset-dropdown" id="preset-dropdown-container">
      <div class="preset-dropdown-trigger" onclick="document.getElementById('preset-dropdown-container').classList.toggle('open')">
        <span>${triggerLabel}</span>
        ${triggerSwatches}
      </div>
      <div class="preset-dropdown-menu">
        <div class="preset-dropdown-item ${matchedPreset === '' ? 'selected' : ''}" onclick="applyPalettePreset('')">
          <span>-- Custom / Base Derived --</span>
          ${renderSwatches(S.palette)}
        </div>
        ${Object.entries(COLOR_PRESETS).map(([name, pal]) => `
          <div class="preset-dropdown-item ${name === matchedPreset ? 'selected' : ''}" onclick="applyPalettePreset('${name}')">
            <span>${name}</span>
            ${renderSwatches(pal)}
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  <div class="row" style="margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #30363d; gap:6px;">
    <label title="Derives the whole palette below from one accent color — sky/terrain shades plus rockEdge/rockGlow/fog. Fine-tune individual keys after.">Base</label>
    <input type="color" id="palette-base-picker" value="${baseHex}">
    <select id="palette-generate-mode" onchange="S.paletteGenMode=this.value" style="width:76px; font-size:11px; padding:3px 6px; background:#161b22; color:#e6edf3; border:1px solid #30363d; border-radius:4px; height:24px;">
      <option value="dark" ${genMode === 'dark' ? 'selected' : ''}>Dark</option>
      <option value="medium" ${genMode === 'medium' ? 'selected' : ''}>Medium</option>
      <option value="light" ${genMode === 'light' ? 'selected' : ''}>Light</option>
    </select>
    <button class="btn on" style="font-size:11px; padding:4px 9px; white-space:nowrap" onclick="generatePaletteFromBase(document.getElementById('palette-base-picker').value, S.paletteGenMode)">Generate</button>
  </div>`;
  // All 7 LEVEL_SCHEMA.palette.fields keys are editable here. rockGlow/fog
  // are stored as (partial) rgba() strings rather than plain hex — they get
  // a real color picker too (parsed/rebuilt via hexToRgb/parseRgba*), fog
  // additionally gets an alpha field since its stored string needs one.
  LEVEL_SCHEMA.palette.fields.forEach(f => {
    if (f.key === 'rockGlow') {
      const { r, g, b } = parseRgbaPrefix(S.palette.rockGlow || f.default);
      html += `<div class="row"><label>${f.label}</label><input type="color" value="${rgbToHex(r,g,b)}" onchange="setRockGlowColor(this.value)"></div>`;
    } else if (f.key === 'fog') {
      const { r, g, b, a } = parseRgba(S.palette.fog || f.default);
      html += `<div class="row"><label>${f.label}</label><input type="color" value="${rgbToHex(r,g,b)}" onchange="setFogColor(this.value)">
        <input type="number" min="0" max="1" step="0.01" value="${a}" style="width:56px;margin-left:4px" title="Fog opacity (0-1)" onchange="setFogAlpha(+this.value)"></div>`;
    } else {
      const val = S.palette[f.key] || f.default;
      const inputType = f.widget === 'color' ? 'color' : 'text';
      const displayVal = (inputType === 'color' ? (val || '#000000') : val).replace(/"/g, '&quot;');
      html += `<div class="row"><label>${f.label}</label><input type="${inputType}" value="${displayVal}" onchange="S.palette['${f.key}']=this.value; draw(); updateOut()"></div>`;
    }
  });
  p.innerHTML = html;
}

// Override setMarkerCoord to handle width
const orig_setMarkerCoord = setMarkerCoord;
setMarkerCoord = function(which, axis, val) {
  if (axis === 'width') {
    if (which === 'hq') S.hqWidth = (val === '' || val == null) ? null : +val;
    else S.cargoWidth = (val === '' || val == null) ? null : +val;
    draw(); updateOut();
  } else {
    orig_setMarkerCoord(which, axis, val);
  }
};

// ── Transform ─────────────────────────────────────────────────────────────────
const w2s = (wx,wy) => ({ sx: wx*S.view.scale + S.view.x, sy: wy*S.view.scale + S.view.y });
const s2w = (sx,sy) => ({ wx: (sx-S.view.x)/S.view.scale, wy: (sy-S.view.y)/S.view.scale });

// ── Resize ────────────────────────────────────────────────────────────────────
function resize() {
  // First-load race: the window/pane can report width 0 before layout
  // settles, which used to latch a 0×0 canvas — a blank editor until the
  // next real resize event. Retry on the next frame instead.
  if (wrap.clientWidth === 0) { requestAnimationFrame(resize); return; }
  canvas.width  = wrap.clientWidth;
  canvas.height = wrap.clientHeight - 22;
  draw();
}
window.addEventListener('resize', resize);
resize();

// ── Level loading ─────────────────────────────────────────────────────────────
async function loadFromServer() {
  const f = document.getElementById('lsel').value;
  if (!f) { alert('Choose a level file first.'); return; }
  
  // Set up globals so the script can register itself when loaded
  window.questPrimary = t => ({id:'primary', text:t, type:'primary'});
  window.questNoCrash = (r=300) => ({id:'no_crash', text:'Zero crashes', type:'bonus', reward:r});
  window.questNoCargoLost = (t='No cargo lost', r=250) => ({id:'no_cargo_lost', text:t, type:'bonus', reward:r});
  window.questQuick = (t,g,r=200) => ({id:'quick', text:t, type:'bonus', reward:r, timeGoal:g});
  window.questSurviveWorm = (r=500) => ({id:'survive_worm', text:'Survive the worm', type:'bonus', reward:r});
  
  window.registerLevel = (cfg) => {
    applyConfig(cfg);
    delete window.registerLevel;
  };

  const script = document.createElement('script');
  script.src = './levels/' + f + '?t=' + Date.now();
  script.onerror = () => {
    alert('Could not load ' + f + '\nMake sure the file exists.');
    script.remove();
  };
  script.onload = () => script.remove();
  document.body.appendChild(script);
}

function loadFromPaste() {
  const src = document.getElementById('paste-in').value.trim();
  if (src) applySource(src);
}

function applySource(src) {
  const cfg = evalLevel(src);
  if (cfg) {
    applyConfig(cfg);
  } else {
    // fallback: regex-parse just polygons
    const polys = regexParsePolys(src);
    if (!polys.length) { alert('Could not parse any polygons from this source.'); return; }
    resetState();
    S.polygons = polys;
    S.selPoly = 0;
    syncLayerButtonsUI();
    fitView(); renderSidebar(); updateOut();
  }
}

function evalLevel(src) {
  let captured = null;
  const rl  = c => { captured = c; };
  const qP  = t     => ({id:'primary', text:t, type:'primary'});
  const qNC = (r=300) => ({id:'no_crash', text:'Zero crashes', type:'bonus', reward:r});
  const qNL = (t='No cargo lost', r=250) => ({id:'no_cargo_lost', text:t, type:'bonus', reward:r});
  const qQ  = (t,g,r=200) => ({id:'quick', text:t, type:'bonus', reward:r, timeGoal:g});
  const qSW = (r=500) => ({id:'survive_worm', text:'Survive the worm', type:'bonus', reward:r});
  try {
    // eslint-disable-next-line no-new-func
    new Function('registerLevel','questPrimary','questNoCrash','questNoCargoLost','questQuick','questSurviveWorm', src)
      (rl, qP, qNC, qNL, qQ, qSW);
  } catch(e) {
    console.warn('evalLevel failed:', e);
    const log = document.getElementById('error-log');
    if (log) {
      log.style.display = 'block';
      log.innerHTML += `<b>Parse Error:</b> ${e.message}<br><b>Stack:</b> ${e.stack}<hr>`;
    }
    return null;
  }
  return captured;
}

function applyConfig(cfg) {
  resetState();
  S.polygons  = (cfg.terrainPolygons || []).map((ptsOrObj, i) => {
    const isObj = ptsOrObj && !Array.isArray(ptsOrObj);
    const pts = isObj ? ptsOrObj.pts : ptsOrObj;
    return {
      pts: pts.map(p => {
        const q = {x:p.x, y:p.y};
        if (p.invisibleEdge) q.invisibleEdge = true;
        if (p.edgeHazard) q.edgeHazard = p.edgeHazard;
        return q;
      }),
      shadowEnabled: isObj ? ptsOrObj.shadowEnabled : undefined,
      shadowAngle: isObj ? ptsOrObj.shadowAngle : undefined,
      shadowLength: isObj ? ptsOrObj.shadowLength : undefined,
      comment: guessComment(pts, i),
      hidden: false
    };
  });
  // Water/hazard polygon shapes depend on terrain for the legacy-rect/circle
  // migration below (it ray-casts against S.polygons), so build these after.
  S.waterPolys  = (cfg.waterBodies || []).map(waterToShape);
  S.hazardPolys = (cfg.hazards     || []).map(hazardToShape);
  S.segments  = (cfg.segments || []).map((seg, i) => ({
    pts: [{x: seg.x1, y: seg.y1}, {x: seg.x2, y: seg.y2}],
    comment: 'Segment ' + (i+1),
    hidden: false
  }));
  S.hubs      = cfg.deliveryHubs || [];
  S.collectibles = (cfg.collectibles || []).map(c => ({...c}));
  S.radarZone = cfg.radarPingZone || null;
  S.windGust = cfg.windGust || null;
  // L9-style shorthand: `outOfBounds: true` instead of a full config object.
  // Treated as an empty-but-enabled object internally (so the panel/rendering
  // code that reads S.oob.<field> keeps working unmodified) with a flag that
  // makes the exporter emit the boolean back out verbatim, as long as no field
  // gets edited — see setOOB()/toggleOOB() below, which clear the flag the
  // moment the level actually needs the full object form.
  S.oobIsBoolean = cfg.outOfBounds === true;
  S.oob       = cfg.outOfBounds === true ? {} : (cfg.outOfBounds || null);
  S.worldBounds = cfg.worldBounds || null;
  // Legacy migration: `outOfBounds.monsterDepth` moved to
  // `worldBounds.bottomY` + bottomAction:'monster' (all in-repo levels are
  // updated; this catches old pasted/saved configs so they re-export in the
  // new shape).
  if (S.oob && S.oob.monsterDepth != null) {
    if (!S.worldBounds) S.worldBounds = {};
    if (S.worldBounds.bottomY == null) {
      S.worldBounds.bottomY = S.oob.monsterDepth;
      S.worldBounds.bottomAction = 'monster';
    }
    delete S.oob.monsterDepth;
  }
  S.palette   = Object.assign({}, DEFAULT_PAL, cfg.palette || {});
  // Defaults must mirror physics.js so the editor shows/edits the pad the
  // game actually uses, even when a level file omits these fields.
  S.startX    = cfg.startX != null ? cfg.startX : 80;
  S.startY    = cfg.startY  ?? null;
  S.collectionX = cfg.collectionX != null ? cfg.collectionX : 280;
  S.collectionY = cfg.collectionY ?? null;
  S.padScale  = cfg.padScale  || 1;
  S.levelName = cfg.name || '';

  S.cfg = {};
  LEVEL_SCHEMA.fields.forEach(f => {
    if (META_EXCLUDE_KEYS.includes(f.key)) return;
    S.cfg[f.key] = levelSchemaGet(cfg, f);
  });
  S.quests = { primary: '', nocrash: false, nocrashReward: null, nocargo: false, nocargoReward: null, quick: null, quickReward: null, worm: false, wormReward: null };
  if (cfg.quests) {
    cfg.quests.forEach(q => {
      if (q.id === 'primary') S.quests.primary = q.text;
      else if (q.id === 'no_crash') { S.quests.nocrash = true; S.quests.nocrashReward = q.reward ?? null; }
      else if (q.id === 'no_cargo_lost') { S.quests.nocargo = true; S.quests.nocargoReward = q.reward ?? null; }
      else if (q.id === 'quick') { S.quests.quick = q.timeGoal; S.quests.quickReward = q.reward ?? null; }
      else if (q.id === 'survive_worm') { S.quests.worm = true; S.quests.wormReward = q.reward ?? null; }
    });
  }
  S.hqWidth = cfg.startDepotWidth || null;
  S.cargoWidth = cfg.collectionWidth || null;

  S.selLayer  = 'terrain';
  S.selPoly   = S.polygons.length > 0 ? 0 : -1;
  syncLayerButtonsUI();

  const ol = document.getElementById('lvl-overlay');
  ol.textContent = cfg.name || '';
  ol.style.display = cfg.name ? '' : 'none';

  renderLevelCard(cfg);
  fitView();
  buildMetaPanel(); // Rebuild panel so the sliders get dynamic limits based on terrain
  renderSidebar();
  updateEntityPanel();

  LEVEL_SCHEMA.fields.forEach(f => {
    if (META_EXCLUDE_KEYS.includes(f.key)) return;
    const el = document.getElementById('cfg-' + f.key);
    if (!el) return;
    if (f.key === 'padScale') { el.value = S.padScale; return; } // routed to S.padScale, not S.cfg
    const v = S.cfg[f.key];
    if (f.widget === 'checkbox') el.checked = !!v;
    else {
      el.value = Array.isArray(v) ? v.join(', ') : (v ?? '');
      // Update slider if it exists
      const slider = document.getElementById('cfg-' + f.key + '-r');
      if (slider) {
        slider.value = v ?? '';
      }
    }
  });

  document.getElementById('quest-primary').value = S.quests.primary;
  document.getElementById('quest-nocrash').checked = S.quests.nocrash;
  document.getElementById('quest-nocargo').checked = S.quests.nocargo;
  document.getElementById('quest-quick').value = S.quests.quick || '';
  document.getElementById('quest-worm').checked = S.quests.worm;

  if (S.oob) {
    document.getElementById('oob-enable').checked = true;
    document.getElementById('oob-fields').style.display = 'flex';
    document.getElementById('oob-preset-row').style.display = 'block';
    document.getElementById('oob-preset-selector').value = '';
    document.getElementById('oob-type').value = S.oob.type || 'water';
    document.getElementById('oob-color').value = S.oob.color || '#3b82f6';
    document.getElementById('oob-mistColor').value = S.oob.mistColor || '#1e3a8a';
    document.getElementById('oob-surfaceY').value = S.oob.surfaceY ?? '';
    document.getElementById('oob-drag').value = S.oob.drag ?? '';
    document.getElementById('oob-buoyancy').value = S.oob.buoyancy ?? '';
  } else {
    document.getElementById('oob-enable').checked = false;
    document.getElementById('oob-fields').style.display = 'none';
    document.getElementById('oob-preset-row').style.display = 'none';
  }
  
  if (S.worldBounds) {
    document.getElementById('wb-enable').checked = true;
    document.getElementById('world-bounds-fields').style.display = 'flex';
    LEVEL_SCHEMA.worldBounds.fields.forEach(f => {
      const el = document.getElementById('wb-' + f.key);
      if (el) el.value = S.worldBounds[f.key] ?? (f.widget === 'select' ? f.default : '');
    });
  } else {
    document.getElementById('wb-enable').checked = false;
    document.getElementById('world-bounds-fields').style.display = 'none';
  }

  if (S.radarZone) {
    document.getElementById('rpz-enable').checked = true;
    document.getElementById('rpz-fields').style.display = 'flex';
    document.getElementById('rpz-cx').value = S.radarZone.cx ?? '';
    document.getElementById('rpz-cy').value = S.radarZone.cy ?? '';
    document.getElementById('rpz-r').value = S.radarZone.r ?? '';
    document.getElementById('rpz-color').value = S.radarZone.color ?? '';
    document.getElementById('rpz-period').value = S.radarZone.period ?? '';
  } else {
    document.getElementById('rpz-enable').checked = false;
    document.getElementById('rpz-fields').style.display = 'none';
  }

  if (S.windGust) {
    document.getElementById('windgust-enable').checked = true;
    document.getElementById('windgust-fields').style.display = 'flex';
    document.getElementById('windgust-calm').value = S.windGust.calm ?? '';
    document.getElementById('windgust-warn').value = S.windGust.warn ?? '';
    document.getElementById('windgust-gust').value = S.windGust.gust ?? '';
    document.getElementById('windgust-gustMult').value = S.windGust.gustMult ?? '';
  } else {
    document.getElementById('windgust-enable').checked = false;
    document.getElementById('windgust-fields').style.display = 'none';
  }

  populatePaletteUI();
  updateHubUI();
  updateCollectibleUI();
  document.getElementById('hq-w').value = S.hqWidth || '';
  document.getElementById('cargo-w').value = S.cargoWidth || '';

  syncAllSliders();
  updateOut();
}

// Keeps each range-slider twin (id + '-r') in sync with its number input —
// called after any bulk write to #map-settings-modal inputs (level load,
// enabling an optional OOB/gravity-well sub-object) so the slider thumb
// reflects the loaded value instead of staying at its default position.
function syncAllSliders() {
  document.querySelectorAll('#map-settings-modal input[type=number]').forEach(inp => {
    const r = document.getElementById(inp.id + '-r');
    if (r && inp.value !== '') r.value = inp.value;
  });
}

// Accepts either the new {pts:[...], hasBoat} polygon format or the old
// {x, width, hasBoat} rect, always returning a polygon shape for the editor.
function waterToShape(wb, i) {
  if (Array.isArray(wb.pts)) {
    return { pts: wb.pts.map(p=>({x:p.x,y:p.y})), comment: wb.comment || '', hidden:false, hasBoat: !!wb.hasBoat, hasFish: !!wb.hasFish };
  }
  const x = wb.x ?? 0, w = wb.width ?? 200;
  const yTop = groundYAt(x) ?? groundYAt(x+w) ?? 600;
  const yBot = yTop + 48;
  return { pts: [ {x,y:yTop}, {x:x+w,y:yTop}, {x:x+w,y:yBot}, {x,y:yBot} ], comment:'', hidden:false, hasBoat: !!wb.hasBoat, hasFish: !!wb.hasFish };
}

// Accepts either the new {pts:[...], type} polygon format or the old
// {x, y, radius, type} circle, always returning a polygon shape for the editor.
function hazardToShape(h, i) {
  if (Array.isArray(h.pts)) {
    const shape = { pts: h.pts.map(p=>({x:p.x,y:p.y})), comment: h.comment || '', hidden:false, type: h.type || 'zone' };
    if (shape.type === 'laser') {
      shape.onMs = h.onMs ?? 1500;
      shape.offMs = h.offMs ?? 1000;
      shape.phaseOffset = h.phaseOffset ?? 0;
      shape.warnMs = h.warnMs ?? 400;
      shape.damagePerSec = h.damagePerSec ?? 40;
      shape.thickness = h.thickness ?? 14;
    } else if (shape.type === 'gravwell') {
      shape.speed = h.speed ?? 100;
      shape.radius = h.radius ?? 200;
      shape.startForce = h.startForce ?? 1.5;
      shape.endForce = h.endForce ?? 0;
    } else if (shape.type === 'sandworm') {
      shape.spawnRate = h.spawnRate ?? 1.0;
    }
    return shape;
  }
  const cx = h.x ?? 0, cy = h.y ?? 0, r = h.radius ?? 40;
  const pts = [];
  for (let k=0; k<8; k++) {
    const a = k/8*Math.PI*2;
    pts.push({ x: Math.round(cx+Math.cos(a)*r), y: Math.round(cy+Math.sin(a)*r) });
  }
  return { pts, comment:'', hidden:false, type: h.type || 'zone' };
}

function resetState() {
  S.polygons=[]; S.waterPolys=[]; S.hazardPolys=[]; S.segments=[]; S.hubs=[]; S.collectibles=[]; S.gravWell=null; S.radarZone=null; S.windGust=null; S.oob=null; S.oobIsBoolean=false;
  S.palette=Object.assign({},DEFAULT_PAL); S.startX=0; S.startY=null; S.collectionX=null; S.collectionY=null;
  S.padScale=1; S.levelName=''; S.selLayer='terrain'; S.selPoly=-1; S.selPt=-1;
  document.getElementById('lvl-overlay').style.display='none';
  document.getElementById('level-card').style.display='none';
  const errLog = document.getElementById('error-log');
  if (errLog) {
    errLog.style.display = 'none';
    errLog.innerHTML = '';
  }
}

// Builds a ready-to-edit blank level — flat rectangle of ground, HQ + Cargo
// Drop Off evenly spaced along it, LEVEL_SCHEMA's default for every mission
// parameter (the same defaults now shown in the Map Settings tooltips), and
// a starter set of quests — a concrete starting point instead of an empty
// canvas of unset fields.
function defaultLevelConfig() {
  const cfg = defaultCfgFromSchema();
  cfg.name = 'levelNew';
  cfg.missionTitle = 'New Mission';
  cfg.description = 'Deliver the cargo to the drop-off point.';
  cfg.startX = 200;
  cfg.startY = null;
  cfg.startDepotWidth = null;
  cfg.collectionX = 1400;
  cfg.collectionY = null;
  cfg.collectionWidth = null;
  cfg.palette = Object.assign({}, DEFAULT_PAL);
  cfg.terrainPolygons = [
    [ {x:-200,y:700}, {x:1800,y:700}, {x:1800,y:900}, {x:-200,y:900} ]
  ];
  cfg.waterBodies = [];
  cfg.hazards = [];
  cfg.deliveryHubs = [];
  cfg.collectibles = [];
  cfg.quests = [
    { id:'primary', text:'Deliver 3 cargo to the depot', type:'primary' },
    { id:'no_crash', text:'Zero crashes', type:'bonus', reward:300 },
    { id:'no_cargo_lost', text:'No cargo lost', type:'bonus', reward:250 },
  ];
  return cfg;
}

function newLevel() {
  applyConfig(defaultLevelConfig());
}

function newEmptyLevel() {
  const cfg = defaultLevelConfig();
  cfg.name = 'levelScratch';
  cfg.missionTitle = 'Scratch Level';
  cfg.terrainPolygons = [];
  applyConfig(cfg);
}

function guessComment(pts, i) {
  const ys = pts.map(p=>p.y);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  if (minY < -50) return 'Ceiling';
  if (pts.length <= 6 && maxY - minY < 300) return `Obstacle ${i}`;
  if (i === 0) return 'Ground';
  return `Polygon ${i+1}`;
}

function regexParsePolys(src) {
  const polys = [];
  const re = /\{\s*x\s*:\s*([-\d.]+)\s*,\s*y\s*:\s*([-\d.]+)(?:,\s*invisibleEdge\s*:\s*(true|false))?(?:,\s*edgeHazard\s*:\s*['"](\w+)['"])?\s*\}/g;
  const blocks = src.split(/\n\s*\[/);
  blocks.slice(1).forEach((block, i) => {
    const pts = []; let m;
    re.lastIndex = 0;
    while ((m = re.exec(block)) !== null) {
      const pt = {x:+m[1], y:+m[2]};
      if (m[3] === 'true') pt.invisibleEdge = true;
      if (m[4]) pt.edgeHazard = m[4];
      pts.push(pt);
    }
    if (pts.length >= 3) polys.push({pts, comment:`Polygon ${i+1}`, hidden:false});
  });
  return polys;
}

function renderLevelCard(cfg) {
  const card = document.getElementById('level-card');
  if (!cfg) { card.style.display='none'; return; }
  const oob = cfg.outOfBounds || {};
  const oobColors = {water:'#0ea5e9',goo:'#ef4444',sand:'#d97706',acid:'#84cc16',void:'#6366f1'};
  const oc = oobColors[oob.type] || '#888';
  card.style.display = '';
  card.innerHTML = `<div class="lname">${cfg.name||''}</div><div class="lmeta">` +
    (oob.type ? `<span class="badge" style="background:${oc}22;color:${oc}">${oob.type}</span>` : '') +
    `grav=${cfg.gravity??'—'} wind=${cfg.wind??0} deposit=$${cfg.deposit??'—'}<br>` +
    `OOB surface y=${oob.surfaceY??'—'} · bottom y=${cfg.worldBounds?.bottomY??'—'}` +
    `</div>`;
}

// ── Draw ──────────────────────────────────────────────────────────────────────
// ── Draw ──────────────────────────────────────────────────────────────────────
let previewTraffic = [];
let previewTrafficSpawnTimer = 0;
let previewAnimId = null;
let previewLastTime = 0;

function getTrafficDefaults() {
  let minPolyY = null;
  let maxPolyY = null;
  if (S.polygons && S.polygons.length > 0) {
    S.polygons.forEach(poly => {
      if (poly.hidden) return;
      poly.pts.forEach(pt => {
        if (minPolyY === null || pt.y < minPolyY) minPolyY = pt.y;
        if (maxPolyY === null || pt.y > maxPolyY) maxPolyY = pt.y;
      });
    });
  }
  if (minPolyY === null || maxPolyY === null) {
    minPolyY = 0;
    maxPolyY = 1000;
  }
  const len = maxPolyY - minPolyY;
  const defMin = minPolyY - 0.75 * len;
  const defMax = minPolyY;
  return { defMin, defMax };
}

function updatePreviewTraffic(dt) {
  const trafficRate = S.cfg.ambientTrafficRate ?? 1;
  if (trafficRate <= 0) {
    previewTraffic = [];
    return;
  }

  // Update existing traffic
  for (let i = previewTraffic.length - 1; i >= 0; i--) {
    const t = previewTraffic[i];
    t.x += t.vx * dt;
    t.lightPhase += dt * 4;

    // Boundary check
    let minX = -1000;
    let maxX = 3000;
    if (S.polygons && S.polygons.length > 0) {
      S.polygons.forEach(poly => {
        poly.pts.forEach(pt => {
          if (pt.x - 500 < minX) minX = pt.x - 500;
          if (pt.x + 500 > maxX) maxX = pt.x + 500;
        });
      });
    }

    if (t.vx > 0 && t.x > maxX) {
      previewTraffic.splice(i, 1);
    } else if (t.vx < 0 && t.x < minX) {
      previewTraffic.splice(i, 1);
    }
  }

  // Spawn new traffic
  const maxTraffic = Math.max(1, Math.round(5 * trafficRate));
  const spawnInterval = Math.max(1.0, 7.0 / trafficRate);

  previewTrafficSpawnTimer += dt;
  if (previewTrafficSpawnTimer > spawnInterval && previewTraffic.length < maxTraffic) {
    previewTrafficSpawnTimer = 0;
    spawnPreviewTruck();
  }
}

function spawnPreviewTruck() {
  let minX = -1000;
  let maxX = 3000;
  if (S.polygons && S.polygons.length > 0) {
    S.polygons.forEach(poly => {
      poly.pts.forEach(pt => {
        if (pt.x - 500 < minX) minX = pt.x - 500;
        if (pt.x + 500 > maxX) maxX = pt.x + 500;
      });
    });
  }

  let tMin = S.cfg.ambientTrafficMinY;
  let tMax = S.cfg.ambientTrafficMaxY;
  if (tMin === '' || tMin === undefined) tMin = null;
  if (tMax === '' || tMax === undefined) tMax = null;

  const defaults = getTrafficDefaults();
  const topY = tMin !== null ? Number(tMin) : defaults.defMin;
  const botY = tMax !== null ? Number(tMax) : defaults.defMax;

  const y = topY + Math.random() * (botY - topY);
  const goRight = Math.random() < 0.5;
  const x = goRight ? minX : maxX;

  const speedMult = S.cfg.ambientTrafficSpeed ?? 1;
  const speed = (1.5 + Math.random() * 1.5) * 60 * speedMult;
  const vx = goRight ? speed : -speed;

  const rModel = Math.random();
  const model = rModel < 0.5 ? 'pickup' : (rModel < 0.90 ? 'freighter' : 'police');

  const pickupColors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9'];
  const freighterColors = ['#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#64748b'];
  const bodyColor = model === 'pickup'
    ? pickupColors[Math.floor(Math.random() * pickupColors.length)]
    : (model === 'freighter' ? freighterColors[Math.floor(Math.random() * freighterColors.length)] : '#1e3a8a');

  const accentColor = model === 'police' ? '#ef4444' : '#38bdf8';

  previewTraffic.push({
    x,
    y,
    vx,
    vy: 0,
    w: model === 'freighter' ? 52 : 32,
    h: model === 'freighter' ? 18 : 12,
    model,
    bodyColor,
    accentColor,
    hasCargoBox: Math.random() < 0.6,
    lightPhase: Math.random() * Math.PI * 2
  });
}

function shadeColor(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function drawPreviewPickup(t) {
  const tw = t.w, th = t.h;
  const w = tw * 1.1;
  const h = th * 0.9;

  ctx.fillStyle = t.bodyColor;
  ctx.strokeStyle = shadeColor(t.bodyColor, -40);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.4, -h * 0.2);
  ctx.lineTo(w * 0.1, -h * 0.3);
  ctx.lineTo(w * 0.4, 0);
  ctx.lineTo(w * 0.1, h * 0.4);
  ctx.lineTo(-w * 0.4, h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-w * 0.35, -h * 0.15);
  ctx.lineTo(0, -h * 0.15);
  ctx.lineTo(-w * 0.1, h * 0.15);
  ctx.lineTo(-w * 0.35, h * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (t.hasCargoBox) {
    ctx.fillStyle = t.accentColor;
    ctx.fillRect(-w * 0.28, -h * 0.08, w * 0.2, h * 0.16);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w * 0.28, -h * 0.08, w * 0.2, h * 0.16);
  }

  ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.beginPath();
  ctx.moveTo(w * 0.1, -h * 0.2);
  ctx.lineTo(w * 0.25, -h * 0.05);
  ctx.lineTo(w * 0.25, h * 0.05);
  ctx.lineTo(w * 0.1, h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.fillRect(-w * 0.45, -h * 0.15, w * 0.05, h * 0.3);

  const fl = 8 + Math.abs(Math.sin(t.lightPhase * 8)) * 8;
  const eg = ctx.createLinearGradient(-w * 0.45, 0, -w * 0.45 - fl, 0);
  eg.addColorStop(0, '#60a5fa');
  eg.addColorStop(0.5, '#3b82f6');
  eg.addColorStop(1, 'rgba(59,130,246,0)');
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.moveTo(-w * 0.45, -h * 0.1);
  ctx.lineTo(-w * 0.45 - fl, 0);
  ctx.lineTo(-w * 0.45, h * 0.1);
  ctx.closePath();
  ctx.fill();
}

function drawPreviewFreighter(t) {
  const tw = t.w, th = t.h;
  const h = th * 1.2;
  const w = tw * 1.1;

  const hullGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  hullGrad.addColorStop(0, shadeColor(t.bodyColor, 10));
  hullGrad.addColorStop(0.5, t.bodyColor);
  hullGrad.addColorStop(1, shadeColor(t.bodyColor, -30));
  ctx.fillStyle = hullGrad;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-w * 0.45, -h * 0.25, w * 0.8, h * 0.5, 4);
  else ctx.rect(-w * 0.45, -h * 0.25, w * 0.8, h * 0.5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = shadeColor(t.bodyColor, 20);
  ctx.beginPath();
  ctx.moveTo(w * 0.35, -h * 0.2);
  ctx.lineTo(w * 0.55, -h * 0.1);
  ctx.lineTo(w * 0.55, h * 0.1);
  ctx.lineTo(w * 0.35, h * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(w * 0.4, -h * 0.05, w * 0.12, h * 0.1);

  const cargoColor = shadeColor(t.bodyColor, -15);
  for (const sign of [-1, 1]) {
    const py = sign * (h * 0.35);
    ctx.fillStyle = cargoColor;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-w * 0.3, py - h * 0.15, w * 0.5, h * 0.3, 3);
    else ctx.rect(-w * 0.3, py - h * 0.15, w * 0.5, h * 0.3);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#475569';
  ctx.fillRect(-w * 0.55, -h * 0.3, w * 0.1, h * 0.2);
  ctx.fillRect(-w * 0.55, h * 0.1, w * 0.1, h * 0.2);

  for (const ey of [-h * 0.2, h * 0.2]) {
    const fl = 10 + Math.abs(Math.sin(t.lightPhase * 6)) * 10;
    const eg2 = ctx.createLinearGradient(-w * 0.55, 0, -w * 0.55 - fl, 0);
    eg2.addColorStop(0, t.accentColor);
    eg2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.55, ey - h * 0.08);
    ctx.lineTo(-w * 0.55 - fl, ey);
    ctx.lineTo(-w * 0.55, ey + h * 0.08);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPreviewPolice(t) {
  const tw = t.w, th = t.h;
  const h = th;
  const w = tw;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(-w/2, 0);
  ctx.lineTo(-w*0.4, -h*0.3);
  ctx.lineTo(w*0.2, -h*0.3);
  ctx.lineTo(w*0.4, 0);
  ctx.lineTo(w/2, h/2);
  ctx.lineTo(-w/2, h/2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(-w*0.2, 0);
  ctx.lineTo(w*0.2, 0);
  ctx.lineTo(w*0.25, h*0.4);
  ctx.lineTo(-w*0.25, h*0.4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.beginPath();
  ctx.moveTo(-w*0.1, -h*0.3);
  ctx.lineTo(w*0.1, -h*0.3);
  ctx.lineTo(w*0.3, 0);
  ctx.lineTo(-w*0.3, 0);
  ctx.closePath();
  ctx.fill();

  const time = Date.now() / 150;
  const flashPhase = time % 2;
  const redFlash = flashPhase < 1;
  const blueFlash = !redFlash;

  ctx.fillStyle = redFlash ? '#ef4444' : '#1e3a8a';
  ctx.fillRect(-w*0.05, -h*0.4, w*0.05, h*0.1);
  ctx.fillStyle = blueFlash ? '#3b82f6' : '#7f1d1d';
  ctx.fillRect(0, -h*0.4, w*0.05, h*0.1);

  if (redFlash) {
    const glow = ctx.createRadialGradient(-w*0.025, -h*0.35, 0, -w*0.025, -h*0.35, 25);
    glow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(-w*0.025, -h*0.35, 25, 0, Math.PI*2); ctx.fill();
  } else {
    const glow = ctx.createRadialGradient(w*0.025, -h*0.35, 0, w*0.025, -h*0.35, 25);
    glow.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(w*0.025, -h*0.35, 25, 0, Math.PI*2); ctx.fill();
  }

  ctx.fillStyle = '#64748b';
  ctx.fillRect(-w/2 - 6, h*0.1, 6, h*0.3);
}

function drawPreviewTraffic() {
  previewTraffic.forEach(t => {
    const { sx, sy } = w2s(t.x, t.y);
    if (sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) return;

    ctx.save();
    ctx.globalAlpha = 0.65;
    ctx.translate(sx, sy);
    ctx.scale(S.view.scale, S.view.scale);

    const movingLeft = t.vx < 0;
    if (movingLeft) ctx.scale(-1, 1);

    if (t.model === 'pickup') {
      drawPreviewPickup(t);
    } else if (t.model === 'police') {
      drawPreviewPolice(t);
    } else {
      drawPreviewFreighter(t);
    }

    ctx.restore();
  });
}

function togglePreview() {
  S.previewMode = !S.previewMode;
  document.getElementById('t-preview').className = 'btn' + (S.previewMode ? ' on' : '');
  if (S.previewMode) {
    startPreviewLoop();
  } else {
    stopPreviewLoop();
  }
  draw();
}

function startPreviewLoop() {
  if (previewAnimId) return;
  previewLastTime = performance.now();
  previewTraffic = [];
  previewTrafficSpawnTimer = 0;

  function tick(timestamp) {
    if (!S.previewMode) {
      previewAnimId = null;
      return;
    }
    const dt = (timestamp - previewLastTime) / 1000;
    previewLastTime = timestamp;

    updatePreviewTraffic(dt);
    draw();

    previewAnimId = requestAnimationFrame(tick);
  }
  previewAnimId = requestAnimationFrame(tick);
}

function stopPreviewLoop() {
  if (previewAnimId) {
    cancelAnimationFrame(previewAnimId);
    previewAnimId = null;
  }
  previewTraffic = [];
}

// ── Live engine preview ──────────────────────────────────────────────────────
// Renders the level with the ACTUAL game engine: an iframe loads
// index.html?playtest=1&embed=1 (see index.html's initEditorEmbed()) over the
// canvas. The editor keeps input focus (iframe is pointer-events:none) and
// streams its pan/zoom as free-camera updates over postMessage; edits are
// hot-reloaded into the running engine after a short debounce.
// `var` (not let): resize() → draw() → sendLiveCam() runs during initial
// script evaluation, before this line — let would throw a TDZ ReferenceError.
var liveFrame = null, liveReady = false, liveLevelTimer = null;

function toggleLivePreview() {
  if (liveFrame) { closeLivePreview(); return; }
  // Pre-dismiss the game's first-run modals (same origin → shared storage),
  // and hand the level over exactly like the Playtest button does.
  try {
    localStorage.setItem('cargoLanderHasSeenPortraitSelector', '1');
    localStorage.setItem('cargoLanderHasSeenTutorial', '1');
  } catch (e) {}
  sessionStorage.setItem('playtest_level', buildOut());
  liveFrame = document.createElement('iframe');
  liveFrame.id = 'live-preview-frame';
  liveFrame.src = 'index.html?playtest=1&embed=1';
  wrap.appendChild(liveFrame);
  const badge = document.createElement('div');
  badge.id = 'live-preview-badge';
  badge.textContent = '▶ LIVE ENGINE — pan/zoom follows editor, edits hot-reload';
  wrap.appendChild(badge);
  document.getElementById('t-live').className = 'btn on';
}

function closeLivePreview() {
  if (liveFrame) liveFrame.remove();
  const badge = document.getElementById('live-preview-badge');
  if (badge) badge.remove();
  liveFrame = null; liveReady = false;
  clearTimeout(liveLevelTimer);
  document.getElementById('t-live').className = 'btn';
}

// Editor view → game free-camera: the game maps world→screen as
// (wx - cam.x) * zoom + canvasW/2, the editor as wx * scale + view.x, and the
// iframe covers the canvas exactly, so cam = world point at the canvas centre
// and zoom = the editor scale.
function liveCamFromView() {
  return {
    x: (canvas.width / 2 - S.view.x) / S.view.scale,
    y: (canvas.height / 2 - S.view.y) / S.view.scale,
    zoom: S.view.scale,
  };
}

function sendLiveCam() {
  if (!liveFrame || !liveReady || !liveFrame.contentWindow) return;
  const c = liveCamFromView();
  liveFrame.contentWindow.postMessage({ type: 'editorCam', ...c }, '*');
}

// Debounced hot reload of the whole level into the running engine.
function scheduleLiveLevelSync() {
  if (!liveFrame) return;
  clearTimeout(liveLevelTimer);
  liveLevelTimer = setTimeout(() => {
    if (!liveFrame || !liveReady || !liveFrame.contentWindow) return;
    liveFrame.contentWindow.postMessage(
      { type: 'editorLevel', src: buildOut(), cam: liveCamFromView() },
      '*'
    );
  }, 700);
}

window.addEventListener('message', (ev) => {
  if (ev.data && ev.data.type === 'embedReady') {
    liveReady = true;
    sendLiveCam();
  }
});

function draw() {
  const W=canvas.width, H=canvas.height;
  drawSky(W,H);
  if (!S.previewMode) drawOOB(W,H);
  drawWorldBounds(W,H); // draws full annotations in normal mode, a faint approximate tint in preview
  if (!S.previewMode) drawTrafficBand(W,H);
  drawWaterBodies();
  if (!S.previewMode) drawGrid(W,H);
  drawSpawnMarkers();
  drawHubs();
  drawCollectibleMarkers();
  if (!S.previewMode) drawGravWell();
  if (!S.previewMode) drawSegments();
  drawPolygons();
  if (!S.previewMode) drawHazards();
  if (!S.previewMode) drawEdgePreview();
  if (S.previewMode) drawPreviewTraffic();
  sendLiveCam(); // keep the live engine preview's free camera in sync
}

function drawSky(W,H) {
  const p = S.palette;
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,   p.skyTop || '#020617');
  g.addColorStop(0.5, p.skyMid || '#040b16');
  g.addColorStop(1,   p.skyBot || '#051114');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);
}

function drawOOB(W,H) {
  if (!S.oob) return;
  const { surfaceY, color, mistColor, type } = S.oob;
  if (surfaceY == null) return;

  const { sy: surfSY } = w2s(0, surfaceY);
  const { sy: mistSY } = w2s(0, surfaceY - 150);

  // Mist gradient band above the surface
  const mTop = Math.min(mistSY, surfSY), mBot = Math.max(mistSY, surfSY);
  if (mBot > 0 && mTop < H && mistColor) {
    const gm = ctx.createLinearGradient(0, mTop, 0, mBot);
    gm.addColorStop(0, 'transparent');
    gm.addColorStop(1, mistColor);
    ctx.fillStyle = gm;
    ctx.fillRect(0, Math.max(0,mTop), W, Math.min(H,mBot) - Math.max(0,mTop));
  }

  // OOB body below surface
  if (surfSY < H) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = color || 'rgba(14,165,233,0.4)';
    ctx.fillRect(0, Math.max(0,surfSY), W, H - Math.max(0,surfSY));
    ctx.restore();
  }

  // Surface line + label
  if (surfSY > -20 && surfSY < H + 20) {
    ctx.save();
    ctx.strokeStyle = color || '#0ea5e9';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8,4]);
    ctx.beginPath(); ctx.moveTo(0,surfSY); ctx.lineTo(W,surfSY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = color || '#0ea5e9';
    ctx.font = '10px monospace';
    ctx.fillText(`${type||'OOB'} surface  y=${surfaceY}`, 8, surfSY - 5);
    ctx.restore();
  }

}

// World-boundary bands — one tinted band + dashed edge line per configured
// edge (ceiling / left / right / bottom), labeled with its action. In preview
// mode the labels and dashes are dropped and only a faint tint remains, an
// approximation of how "out there" reads in-game.
function drawWorldBounds(W,H) {
  if (!S.worldBounds) return;
  const wb = S.worldBounds;
  const actionColors = { pushback:'#58a6ff', destroy:'#f85149', police:'#f85149', lose_cargo:'#d29922', monster:'#f85149' };
  const preview = S.previewMode;
  const bandAlpha = preview ? 0.10 : 0.16;

  // Mirrors physics.js's levelWidth derivation: explicit levelWidth (not an
  // editor field today) or the rightmost terrain vertex, min 1600.
  let levelW = 1600;
  S.polygons.forEach(p => p.pts.forEach(pt => { if (pt.x > levelW) levelW = pt.x; }));

  const edgeBand = (fill, x, y, w, h) => {
    ctx.fillStyle = fill;
    ctx.globalAlpha = bandAlpha;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  };
  const edgeLine = (col, x1, y1, x2, y2, label, lx, ly) => {
    if (preview) return;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8,4]);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = col;
    ctx.font = '10px monospace';
    ctx.fillText(label, lx, ly);
  };

  ctx.save();

  if (wb.ceilingY != null && wb.ceilingY !== '') {
    const act = wb.ceilingAction || 'pushback';
    const col = actionColors[act] || '#58a6ff';
    const { sy } = w2s(0, +wb.ceilingY);
    if (sy > 0) edgeBand(col, 0, 0, W, Math.min(sy, H));
    if (sy > -20 && sy < H + 20) edgeLine(col, 0, sy, W, sy, `ceiling  y=${wb.ceilingY} · ${act}`, 8, sy - 5);
  }

  if (wb.bottomY != null && wb.bottomY !== '') {
    const act = wb.bottomAction || 'monster';
    const col = actionColors[act] || '#f85149';
    const { sy } = w2s(0, +wb.bottomY);
    if (sy < H) edgeBand(col, 0, Math.max(0, sy), W, H - Math.max(0, sy));
    if (sy > -20 && sy < H + 20) edgeLine(col, 0, sy, W, sy, `bottom  y=${wb.bottomY} · ${act}`, 8, sy - 5);
  }

  if (wb.leftMargin != null && wb.leftMargin !== '') {
    const act = wb.lateralAction || 'pushback';
    const col = actionColors[act] || '#58a6ff';
    const { sx: leftSX } = w2s(-wb.leftMargin, 0);
    if (leftSX > 0) edgeBand(col, 0, 0, Math.min(leftSX, W), H);
    if (leftSX > -20 && leftSX < W + 20) {
      edgeLine(col, leftSX, 0, leftSX, H, '', 0, 0);
      if (!preview) { ctx.save(); ctx.translate(leftSX - 5, 14); ctx.rotate(Math.PI/2); ctx.fillText(`left bound  x=${-wb.leftMargin} · ${act}`, 0, 0); ctx.restore(); }
    }
  }

  if (wb.rightMargin != null && wb.rightMargin !== '') {
    const act = wb.lateralAction || 'pushback';
    const col = actionColors[act] || '#58a6ff';
    const { sx: rightSX } = w2s(levelW + +wb.rightMargin, 0);
    if (rightSX < W) edgeBand(col, Math.max(0, rightSX), 0, W - Math.max(0, rightSX), H);
    if (rightSX > -20 && rightSX < W + 20) {
      edgeLine(col, rightSX, 0, rightSX, H, '', 0, 0);
      if (!preview) { ctx.save(); ctx.translate(rightSX + 12, 14); ctx.rotate(Math.PI/2); ctx.fillText(`right bound  x=${levelW + +wb.rightMargin} · ${act}`, 0, 0); ctx.restore(); }
    }
  }

  ctx.restore();
}

function drawTrafficBand(W,H) {
  if (!S.cfg) return;
  let tMin = S.cfg.ambientTrafficMinY;
  let tMax = S.cfg.ambientTrafficMaxY;
  if (tMin === '' || tMin === undefined) tMin = null;
  if (tMax === '' || tMax === undefined) tMax = null;
  
  const defaults = getTrafficDefaults();
  const topY = tMin !== null ? Number(tMin) : defaults.defMin;
  const botY = tMax !== null ? Number(tMax) : defaults.defMax;
  
  const { sy: syTop } = w2s(0, topY);
  const { sy: syBot } = w2s(0, botY);
  
  const y1 = Math.min(syTop, syBot);
  const y2 = Math.max(syTop, syBot);
  
  if (y2 < 0 || y1 > H) return;
  
  ctx.save();
  ctx.fillStyle = 'rgba(255, 200, 50, 0.05)';
  ctx.fillRect(0, y1, W, y2 - y1);
  
  ctx.strokeStyle = 'rgba(255, 200, 50, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  
  if (y1 >= 0 && y1 <= H) {
    ctx.beginPath(); ctx.moveTo(0, y1); ctx.lineTo(W, y1); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 200, 50, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText(`TRAFFIC MIN Y (${Math.round(topY)})${tMin === null ? ' (AUTO)' : ''}`, 10, y1 - 4);
  }
  if (y2 >= 0 && y2 <= H) {
    ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(W, y2); ctx.stroke();
    ctx.fillStyle = 'rgba(255, 200, 50, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText(`TRAFFIC MAX Y (${Math.round(botY)})${tMax === null ? ' (AUTO)' : ''}`, 10, y2 + 12);
  }
  ctx.restore();
}

// Generalized polygon-shape drawing — used for terrain, water, and hazard
// layers alike, so all three look and behave consistently (fill, edge glow,
// vertex handles, centroid label).
function drawShapeList(list, opts) {
  list.forEach((poly, pi) => {
    if (poly.hidden) return;
    const isActive = !S.previewMode && S.selLayer === opts.layer && pi === S.selPoly;
    const ac = POLY_COLORS[pi % POLY_COLORS.length];
    if (poly.pts.length < 2) return;

    ctx.save();
    ctx.beginPath();
    poly.pts.forEach((pt,i) => {
      const {sx,sy} = w2s(pt.x, pt.y);
      i===0 ? ctx.moveTo(sx,sy) : ctx.lineTo(sx,sy);
    });
    ctx.closePath();

    // Fill
    ctx.fillStyle = opts.fillColor;
    ctx.globalAlpha = isActive ? Math.min(1, opts.fillAlpha + 0.16) : opts.fillAlpha;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Edge glow (wide, soft)
    ctx.strokeStyle = isActive ? ac : opts.edgeColor;
    ctx.lineWidth = 5;
    ctx.globalAlpha = isActive ? 0.22 : 0.12;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Edge sharp line
    ctx.lineWidth = isActive ? 2 : 1.5;
    ctx.stroke();

    if (!S.previewMode) {
      // Vertex handles
      poly.pts.forEach((pt, pti) => {
        const {sx,sy} = w2s(pt.x, pt.y);
        const isSel = isActive && pti===S.selPt;

        ctx.beginPath(); ctx.arc(sx, sy, isSel ? 8 : 5, 0, Math.PI*2);
        ctx.fillStyle = ac;
        ctx.globalAlpha = isActive ? (isSel ? 0.30 : 0.14) : 0.06;
        ctx.fill(); ctx.globalAlpha = 1;

        ctx.beginPath(); ctx.arc(sx, sy, isSel ? 3.5 : 2.5, 0, Math.PI*2);
        ctx.fillStyle = isSel ? '#fff' : (isActive ? ac : opts.edgeColor);
        ctx.fill();
        if (isSel) { ctx.strokeStyle = ac; ctx.lineWidth = 2; ctx.stroke(); }

        if (isActive) {
          ctx.fillStyle = '#e6edf3'; ctx.font = '9px monospace';
          ctx.fillText(pti, sx+7, sy-3);
        }
      });

      // Centroid label
      const fallback = opts.layer==='water' ? 'Water' : opts.layer==='hazard' ? (poly.type||'Hazard') : '';
      let extraLabel = '';
      if (opts.layer === 'water') {
          if (poly.hasBoat) extraLabel += ' ⛵';
          if (poly.hasFish) extraLabel += ' 🐟';
      }
      const label = (poly.comment || fallback) + extraLabel;
      if (label) {
        const cx = poly.pts.reduce((s,p)=>s+p.x,0)/poly.pts.length;
        const cy = poly.pts.reduce((s,p)=>s+p.y,0)/poly.pts.length;
        const {sx,sy} = w2s(cx,cy);
        ctx.fillStyle = isActive ? ac : ac+'88';
        ctx.font = (isActive?'bold ':'') + '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, sx, sy);
        ctx.textAlign = 'left';
      }
    }

    ctx.restore();
  });
}

function drawWaterBodies() {
  drawShapeList(S.waterPolys, { layer:'water', fillColor:'rgba(14,45,90,0.55)', edgeColor:'#0ea5e9', fillAlpha:0.55 });
}

function drawHazards() {
  const time = performance.now();
  
  S.hazardPolys.forEach((h) => {
    if (h.hidden || !h.pts || h.pts.length < 1) return;
    ctx.save();
    if (h.type === 'laser' && h.pts.length >= 2) {
      const a = w2s(h.pts[0].x, h.pts[0].y);
      const b = w2s(h.pts[1].x, h.pts[1].y);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.strokeStyle = h.color || '#ef4444';
      ctx.lineWidth = (h.thickness || 15) * S.view.scale;
      ctx.globalAlpha = 0.5 + Math.sin(time/200)*0.2;
      ctx.stroke();
      ctx.lineWidth = ((h.thickness || 15) * 0.4) * S.view.scale;
      ctx.strokeStyle = '#fff';
      ctx.globalAlpha = 0.9;
      ctx.stroke();
    } else if (h.type === 'crusher' && h.pts.length >= 2) {
      const a = w2s(h.pts[0].x, h.pts[0].y);
      const b = w2s(h.pts[1].x, h.pts[1].y);
      const w = Math.abs(b.sx - a.sx);
      const h_px = Math.abs(b.sy - a.sy);
      const x = Math.min(a.sx, b.sx);
      const y = Math.min(a.sy, b.sy);
      ctx.fillStyle = '#222';
      ctx.fillRect(x, y, w, h_px);
      ctx.strokeStyle = h.color || '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h_px);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h_px);
      ctx.clip();
      ctx.strokeStyle = h.color || '#ef4444';
      ctx.lineWidth = 6 * S.view.scale;
      for (let i = -w-h_px; i < w+h_px; i += 16 * S.view.scale) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h_px, y + h_px);
        ctx.stroke();
      }
      ctx.restore();
    } else if (h.type === 'sandworm' && h.pts.length >= 3) {
      // Draw reach radius preview
      const cx = h.pts.reduce((s,p)=>s+p.x,0)/h.pts.length;
      const cy = h.pts.reduce((s,p)=>s+p.y,0)/h.pts.length;
      const cp = w2s(cx, cy);
      ctx.beginPath();
      ctx.arc(cp.sx, cp.sy, (h.reach || 300) * S.view.scale, 0, Math.PI*2);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.fillStyle = '#b45309';
      ctx.globalAlpha = 0.1;
      ctx.fill();

      // Draw triangle
      ctx.beginPath();
      h.pts.forEach((pt, i) => {
        const p = w2s(pt.x, pt.y);
        i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
      });
      ctx.closePath();
      ctx.fillStyle = '#b45309';
      ctx.globalAlpha = 0.4;
      ctx.fill();
    } else if (h.type === 'pickup' && h.pts.length >= 1) {
      const p = w2s(h.pts[0].x, h.pts[0].y);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 15 * S.view.scale, 0, Math.PI*2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3 * S.view.scale;
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.globalAlpha = 0.3;
      ctx.fill();
    } else if (h.type === 'repulsor' && h.pts.length >= 3) {
      ctx.beginPath();
      h.pts.forEach((pt, i) => {
        const p = w2s(pt.x, pt.y);
        i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
      });
      ctx.closePath();
      ctx.fillStyle = h.color || '#0ea5e9';
      ctx.globalAlpha = 0.2;
      ctx.fill();
      const cx = h.pts.reduce((s,p)=>s+p.x,0)/h.pts.length;
      const cy = h.pts.reduce((s,p)=>s+p.y,0)/h.pts.length;
      const cp = w2s(cx, cy);
      const fx = h.travelX || 0;
      const fy = h.travelY || -15;
      ctx.beginPath();
      ctx.moveTo(cp.sx, cp.sy);
      ctx.lineTo(cp.sx + (fx * 5 * S.view.scale), cp.sy + (fy * 5 * S.view.scale));
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
    } else if (h.type === 'bouncer' && h.pts.length >= 3) {
      ctx.beginPath();
      h.pts.forEach((pt, i) => {
        const p = w2s(pt.x, pt.y);
        i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
      });
      ctx.closePath();
      ctx.fillStyle = h.color || '#d946ef';
      ctx.globalAlpha = 0.4 + Math.sin(time/150)*0.1;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2 * S.view.scale;
      ctx.stroke();
    } else if (h.type === 'gravwell' && h.pts.length >= 2) {
      // Draw path
      ctx.beginPath();
      h.pts.forEach((pt, i) => {
        const p = w2s(pt.x, pt.y);
        i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
      });
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2 * S.view.scale;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw start position and radius
      const p = w2s(h.pts[0].x, h.pts[0].y);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, (h.radius || 200) * S.view.scale, 0, Math.PI*2);
      ctx.fillStyle = '#a855f7';
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.strokeStyle = '#d8b4fe';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#d8b4fe';
      ctx.font = '10px sans-serif';
      ctx.fillText('startForce: ' + (h.startForce || 1.5), p.sx - 30, p.sy - 15);
    }
    ctx.restore();
  });

  const genericHazards = S.hazardPolys.filter(h => h.type !== 'gravwell');
  drawShapeList(genericHazards, { layer:'hazard', fillColor:'rgba(239,68,68,0.0)', edgeColor:'#ef4444', fillAlpha:0.1 });
}

function drawGrid(W,H) {
  const step = niceStep();
  const tl = s2w(0,0), br = s2w(W,H);
  const x0 = Math.floor(tl.wx/step)*step;
  const y0 = Math.floor(tl.wy/step)*step;

  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let wx=x0; wx<br.wx+step; wx+=step) {
    const {sx} = w2s(wx,0);
    ctx.beginPath(); ctx.moveTo(sx,0); ctx.lineTo(sx,H); ctx.stroke();
  }
  for (let wy=y0; wy<br.wy+step; wy+=step) {
    const {sy} = w2s(0,wy);
    ctx.beginPath(); ctx.moveTo(0,sy); ctx.lineTo(W,sy); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '9px monospace';
  for (let wx=x0; wx<br.wx+step; wx+=step) {
    const {sx} = w2s(wx,0);
    if (sx>4 && sx<W-4) ctx.fillText(wx, sx+2, H-5);
  }
  for (let wy=y0; wy<br.wy+step; wy+=step) {
    const {sy} = w2s(0,wy);
    if (sy>14 && sy<H-5) ctx.fillText(wy, 3, sy-2);
  }

  // Origin cross
  const o = w2s(0,0);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(o.sx-12,o.sy); ctx.lineTo(o.sx+12,o.sy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(o.sx,o.sy-12); ctx.lineTo(o.sx,o.sy+12); ctx.stroke();
}

function niceStep() {
  const units = canvas.width / S.view.scale;
  const raw = units / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return [1,2,5,10].map(f=>f*mag).find(s=>s>=raw) || mag*10;
}

function drawPolygons() {
  drawShapeList(S.polygons, {
    layer: 'terrain',
    fillColor: S.palette.terrainFill || '#06101c',
    edgeColor: S.palette.rockEdge    || '#38bdf8',
    fillAlpha: 0.72
  });
}

function drawSegments() {
  S.segments.forEach((seg,i) => {
    if (seg.hidden || !seg.pts || seg.pts.length < 2) return;
    const a = w2s(seg.pts[0].x, seg.pts[0].y), b = w2s(seg.pts[1].x, seg.pts[1].y);
    ctx.save();
    ctx.strokeStyle = '#ff9966'; ctx.lineWidth = 2.5;
    if (S.selLayer === 'segments' && i === S.selPoly) {
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([]);
    } else {
      ctx.setLineDash([6,4]);
    }
    ctx.beginPath(); ctx.moveTo(a.sx,a.sy); ctx.lineTo(b.sx,b.sy); ctx.stroke();
    ctx.setLineDash([]);
    [a,b].forEach(({sx,sy}) => {
      ctx.beginPath(); ctx.arc(sx,sy,4,0,Math.PI*2); ctx.fillStyle='#ff9966'; ctx.fill();
    });
    const mx=(a.sx+b.sx)/2, my=(a.sy+b.sy)/2;
    ctx.fillStyle='#ff996688'; ctx.font='9px monospace'; ctx.textAlign='center';
    ctx.fillText(seg.comment || `seg${i}`, mx, my-7); ctx.textAlign='left';
    ctx.restore();
  });
}

function groundYAt(worldX) {
  let maxSurfaceY = 0;
  S.polygons.forEach(poly => {
    if (poly.hidden) return;
    for (let i = 0; i < poly.pts.length; i++) {
      const p1 = poly.pts[i], p2 = poly.pts[(i+1) % poly.pts.length];
      // Match the game's logic: only consider upward-facing floor segments (p1.x < p2.x)
      if (p1.x < p2.x && p1.x <= worldX && p2.x >= worldX) {
        const ratio = (worldX - p1.x) / (p2.x - p1.x);
        const y = p1.y + ratio * (p2.y - p1.y);
        if (maxSurfaceY === 0 || y > maxSurfaceY) {
          maxSurfaceY = y;
        }
      }
    }
  });
  return maxSurfaceY === 0 ? null : maxSurfaceY;
}

function drawHubs() {
  const H = canvas.height;
  S.hubs.forEach((hub, hi) => {
    const col = hub.color || '#ffd700';
    const {sx} = w2s(hub.x, 0);
    const padW = hub.width || 80 * S.padScale;
    const padHalfW = padW / 2;
    const isHov = S.hoverMarker?.hub === hi || S.dragMarker?.hub === hi;
    const gy = (hub.y != null) ? hub.y : groundYAt(hub.x);

    if (S.previewMode) {
      if (gy !== null) {
        if (hub.type === 'chute') drawGamePreviewChute(hub.x - padHalfW, gy, padW, col);
        else drawGamePreviewHub(hub.x - padHalfW, gy, padW, col, hub.style || 'crane', hub.name);
      }
      return;
    }

    ctx.save();
    // Vertical guide line
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([4,4]); ctx.globalAlpha = isHov ? 0.55 : 0.25;
    ctx.beginPath(); ctx.moveTo(sx,0); ctx.lineTo(sx,H); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    if (gy !== null) {
      // Draw hub pad on terrain surface
      const {sx:lx, sy:ly} = w2s(hub.x - padHalfW, gy);
      const {sx:rx}        = w2s(hub.x + padHalfW, gy);
      const {sx:cx, sy:cy} = w2s(hub.x, gy);
      const padWpx = rx - lx;

      // Fill rect above surface line
      ctx.fillStyle = col + (isHov ? '44' : '22');
      ctx.fillRect(lx, cy - 18, padWpx, 18);

      // Surface pad line
      ctx.strokeStyle = col; ctx.lineWidth = isHov ? 4 : 3;
      ctx.globalAlpha = isHov ? 1 : 0.85;
      ctx.beginPath(); ctx.moveTo(lx, cy); ctx.lineTo(rx, cy); ctx.stroke();
      ctx.globalAlpha = 1;

      // Drag affordance + labels above pad
      ctx.fillStyle = col; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      if (isHov) ctx.fillText('↔', cx, cy - 22);
      ctx.fillText(hub.name || 'Hub', cx, cy - 8);
      ctx.font = '9px monospace';
      ctx.fillText(`x=${hub.x}${hub.type?' ['+hub.type+']':''}`, cx, cy - 20);
    } else {
      // Fallback: floating bar at screen top when no terrain found
      const padWpx = padHalfW * 2 * S.view.scale;
      const barY = 8;
      ctx.fillStyle = col + (isHov?'44':'28'); ctx.fillRect(sx-padWpx/2, barY, padWpx, 20);
      ctx.strokeStyle = col; ctx.lineWidth = isHov ? 2 : 1.5; ctx.strokeRect(sx-padWpx/2, barY, padWpx, 20);
      ctx.fillStyle = col; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
      if (isHov) ctx.fillText('↔', sx, barY - 2);
      ctx.fillText(hub.name || 'Hub', sx, barY+13);
      ctx.font = '9px monospace';
      ctx.fillText(`x=${hub.x}${hub.type?' ['+hub.type+']':''}`, sx, barY+30);
    }

    ctx.textAlign = 'left';
    ctx.restore();
  });
}

function drawGravWell() {
  if (!S.gravWell) return;
  const {x, y, radius=100, orbitRadius=0, strength=1} = S.gravWell;
  const {sx,sy} = w2s(x,y);
  const r   = radius      * S.view.scale;
  const orb = orbitRadius * S.view.scale;

  ctx.save();
  // Orbit ring
  if (orb > 1) {
    ctx.beginPath(); ctx.arc(sx,sy,orb,0,Math.PI*2);
    ctx.strokeStyle='#ff66cc44'; ctx.lineWidth=1; ctx.setLineDash([4,6]); ctx.stroke();
    ctx.setLineDash([]);
  }
  // Pull radius glow fill
  const rg = ctx.createRadialGradient(sx,sy,0,sx,sy,r);
  rg.addColorStop(0,'#ff66cc55'); rg.addColorStop(0.6,'#ff66cc1a'); rg.addColorStop(1,'transparent');
  ctx.fillStyle=rg;
  ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.fill();
  // Pull radius ring
  ctx.strokeStyle='#ff66cc'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.stroke();
  // Core
  ctx.beginPath(); ctx.arc(sx,sy,5,0,Math.PI*2); ctx.fillStyle='#ff66cc'; ctx.fill();
  // Labels
  ctx.fillStyle='#ff66cccc'; ctx.font='10px monospace';
  ctx.fillText(`gravity well  str=${strength}`, sx+12, sy+2);
  ctx.fillText(`r=${radius}  orbit=${orbitRadius}`, sx+12, sy+14);
  ctx.restore();
}

// Collectibles are free-floating points (no terrain-surface snapping like
// hubs), so this draws a simple draggable token straight from {x,y}.
function drawCollectibleMarkers() {
  S.collectibles.forEach((c, i) => {
    const def = window.COLLECTIBLE_TYPES && window.COLLECTIBLE_TYPES[c.type];
    if (!def) return;
    const {sx, sy} = w2s(c.x, c.y);
    const r = (c.radius || def.radius || 24) * S.view.scale;
    const isHov = S.hoverMarker?.collectible === i || S.dragMarker?.collectible === i;
    ctx.save();
    ctx.globalAlpha = isHov ? 1 : 0.85;
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(r, 6), 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = def.edgeColor; ctx.lineWidth = isHov ? 3 : 2; ctx.stroke();
    ctx.fillStyle = def.edgeColor;
    ctx.font = `bold ${Math.max(Math.round(r*0.9), 10)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(def.icon || '?', sx, sy+1);
    ctx.restore();
  });
}

function drawSpawnMarkers() {
  const hqW = S.hqWidth || (80 * S.padScale);
  const cargoW = S.cargoWidth || (100 * S.padScale);

  if (S.previewMode) {
    const hqY = S.startY != null ? S.startY : groundYAt(S.startX);
    if (hqY !== null) drawGamePreviewHQ(S.startX, hqY, hqW);
    if (S.collectionX != null) {
      const cy = S.collectionY != null ? S.collectionY : groundYAt(S.collectionX);
      if (cy !== null) drawGamePreviewCargo(S.collectionX, cy, cargoW);
    }
    return;
  }

  // Widths match physics.js defaults: startDepot = 80*padScale, collectionPoint = 100*padScale
  spawnZone(S.startX, hqW, '#38bdf8', S.startY);
  spawnLine(S.startX, 'HQ', '#38bdf8', S.hoverMarker==='hq'||S.dragMarker==='hq', S.startY);
  if (S.collectionX != null) {
    spawnZone(S.collectionX, cargoW, '#4ade80', S.collectionY);
    spawnLine(S.collectionX, 'Cargo', '#4ade80', S.hoverMarker==='depot'||S.dragMarker==='depot', S.collectionY);
  }
}

// Translucent pad rectangle showing the actual pickup/start zone width on the
// terrain surface (mirrors the fill+stroke pad rendering in drawHubs()).
function spawnZone(worldX, width, color, worldY) {
  const gy = (worldY != null) ? worldY : groundYAt(worldX);
  if (gy === null) return;
  const {sx:lx, sy:ly} = w2s(worldX, gy);
  const {sx:rx}        = w2s(worldX + width, gy);
  ctx.save();
  ctx.fillStyle = color + '22';
  ctx.fillRect(lx, ly - 18, rx - lx, 18);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ly); ctx.stroke();
  ctx.restore();
}

function spawnLine(worldX, label, color, isHov, worldY) {
  const {sx} = w2s(worldX, 0);
  const H = canvas.height;
  const gy = (worldY != null) ? worldY : groundYAt(worldX);
  ctx.save();
  // Dashed vertical line
  ctx.strokeStyle=color; ctx.lineWidth=1; ctx.setLineDash([3,5]); ctx.globalAlpha=isHov?0.6:0.3;
  ctx.beginPath(); ctx.moveTo(sx,0); ctx.lineTo(sx,H); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha=1;

  if (gy !== null) {
    const {sx:mx, sy:my} = w2s(worldX, gy);
    const dm = 7;
    // Diamond on terrain surface (or at Y override)
    ctx.fillStyle = isHov ? color+'88' : color+'33';
    ctx.strokeStyle = color; ctx.lineWidth = isHov ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(mx, my-dm); ctx.lineTo(mx+dm, my); ctx.lineTo(mx, my+dm); ctx.lineTo(mx-dm, my);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Labels above diamond
    ctx.fillStyle=color; ctx.font='bold 10px monospace'; ctx.textAlign='center';
    if (isHov) ctx.fillText(worldY!=null?'✥':'↔', mx, my-dm-12);
    ctx.fillText(label, mx, my-dm-1);
    ctx.font='9px monospace';
    const yLabel = worldY != null ? ` y=${worldY}` : '';
    ctx.fillText('x='+worldX+yLabel, mx, my+dm+11);
  } else {
    // Fallback triangle at screen top
    ctx.fillStyle=isHov?color+'88':color+'33'; ctx.strokeStyle=color; ctx.lineWidth=isHov?2:1.5;
    ctx.beginPath(); ctx.moveTo(sx,42); ctx.lineTo(sx-7,52); ctx.lineTo(sx+7,52); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle=color; ctx.font='bold 10px monospace'; ctx.textAlign='center';
    ctx.fillText(label, sx, 40);
    if (isHov) ctx.fillText('↔', sx, 30);
    ctx.font='9px monospace';
    ctx.fillText('x='+worldX, sx, 63);
  }
  ctx.textAlign='left';
  ctx.restore();
}

function drawEdgePreview() {
  const ep = S.edgePreview;
  if (!ep) return;
  const poly = listForLayer(ep.layer)[ep.pi];
  if (!poly || poly.hidden) return;
  const ac = POLY_COLORS[ep.pi % POLY_COLORS.length];
  const a = poly.pts[ep.edgeIdx], b = poly.pts[(ep.edgeIdx+1) % poly.pts.length];
  const as = w2s(a.x,a.y), bs = w2s(b.x,b.y);
  const {sx,sy} = w2s(ep.pt.x, ep.pt.y);

  ctx.save();
  // Highlight the edge that will be split
  ctx.strokeStyle=ac; ctx.lineWidth=3; ctx.globalAlpha=0.75;
  ctx.setLineDash([5,4]);
  ctx.beginPath(); ctx.moveTo(as.sx,as.sy); ctx.lineTo(bs.sx,bs.sy); ctx.stroke();
  ctx.setLineDash([]); ctx.globalAlpha=1;
  // Preview dot
  ctx.beginPath(); ctx.arc(sx,sy,9,0,Math.PI*2);
  ctx.fillStyle=ac+'33'; ctx.fill();
  ctx.beginPath(); ctx.arc(sx,sy,4,0,Math.PI*2);
  ctx.fillStyle=ac; ctx.fill();
  ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
  // Coordinate label
  ctx.fillStyle=ac; ctx.font='9px monospace'; ctx.textAlign='center';
  ctx.fillText(`${ep.pt.x}, ${ep.pt.y}`, sx, sy-13);
  ctx.textAlign='left';
  ctx.restore();
}

// ── Fit view ──────────────────────────────────────────────────────────────────
function fitView() {
  const allShapes = [...S.polygons, ...S.waterPolys, ...S.hazardPolys];
  if (!allShapes.length) { S.view={x:200,y:150,scale:0.35}; draw(); return; }
  let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
  allShapes.forEach(p => p.pts.forEach(pt => {
    minX=Math.min(minX,pt.x); maxX=Math.max(maxX,pt.x);
    minY=Math.min(minY,pt.y); maxY=Math.max(maxY,pt.y);
  }));
  // Include OOB surface / bottom boundary in vertical range so they're visible
  if (S.oob?.surfaceY != null) maxY = Math.max(maxY, S.oob.surfaceY + 100);
  if (S.worldBounds?.bottomY != null) maxY = Math.max(maxY, S.worldBounds.bottomY + 100);
  const pad=80;
  const sw=canvas.width-pad*2, sh=canvas.height-pad*2;
  const scale = Math.min(sw/(maxX-minX||100), sh/(maxY-minY||100), 2);
  S.view.scale = scale;
  S.view.x = pad + (sw-(maxX-minX)*scale)/2 - minX*scale;
  S.view.y = pad + (sh-(maxY-minY)*scale)/2 - minY*scale;
  draw();
}

// ── Mode & Snap ───────────────────────────────────────────────────────────────
function setMode(m) {
  S.mode = m;
  ['select-pt','select-poly','add','pan'].forEach(id => {
    const el = document.getElementById('m-'+id);
    if (el) el.className = 'btn' + (id===m?' on':'');
  });
  canvas.style.cursor = m==='pan'?'grab' : m==='add'?'crosshair':'default';
}
setMode('select-pt');

function setSnap(n) {
  S.snap = n;
  [1,10,50,100].forEach(v => document.getElementById('sn'+v).className='btn'+(v===n?' on':''));
  document.getElementById('sdisp').textContent = n;
}

// ── Sidebar rendering ─────────────────────────────────────────────────────────
function renderSidebar() {
  const listEl = document.getElementById('poly-list');
  listEl.innerHTML = '';
  const arr = activeList();
  arr.forEach((poly, i) => {
    const col = POLY_COLORS[i%POLY_COLORS.length];
    const fallback = S.selLayer==='water' ? `Water ${i+1}` : S.selLayer==='hazard' ? `${poly.type||'Hazard'} ${i+1}` : `Polygon ${i+1}`;
    const d = document.createElement('div');
    d.className = 'pitem'+(i===S.selPoly?' active':'');
    d.innerHTML =
      `<div class="pdot" style="background:${col};opacity:${poly.hidden?.4:1}"></div>` +
      `<span class="pname" style="opacity:${poly.hidden?.4:1}">${poly.comment||fallback}</span>` +
      `<span class="pcnt">${poly.pts.length}pt</span>` +
      `<span class="plock" title="toggle lock" onclick="toggleLock(${i},event)">${poly.locked?'🔒':'🔓'}</span>` +
      `<span class="peye" title="toggle visibility" onclick="toggleHide(${i},event)">${poly.hidden?'◌':'●'}</span>`;
    d.onclick = () => { S.selPoly=i; S.selPt=-1; renderSidebar(); renderPtList(); draw(); };
    listEl.appendChild(d);
  });
  renderPtUI();
}

function renderPtUI() {
  const arr = activeList();
  const hasPoly = arr.length > 0 && S.selPoly >= 0 && S.selPoly < arr.length;
  document.getElementById('pt-panel').style.display = hasPoly ? 'block' : 'none';
  const hazardRow = document.getElementById('hazard-type-row');
  const timingRow = document.getElementById('laser-timing-row');
  const swTimingRow = document.getElementById('sandworm-timing-row');
  const repRow = document.getElementById('repulsor-vector-row');
  const gwRow = document.getElementById('gravwell-properties-row');
  const crusherRow = document.getElementById('crusher-properties-row');
  const waterRow = document.getElementById('water-properties-row');
  const terrainShadowRow = document.getElementById('terrain-shadow-row');
  if (hasPoly) {
    document.getElementById('poly-rename').value = arr[S.selPoly].comment || '';
    if (S.selLayer === 'terrain') {
      const poly = arr[S.selPoly];
      terrainShadowRow.style.display = 'block';
      document.getElementById('terrain-shadow-enabled').checked = poly.shadowEnabled !== false;
      document.getElementById('terrain-shadow-angle').value = poly.shadowAngle !== undefined ? poly.shadowAngle : '';
      document.getElementById('terrain-shadow-length').value = poly.shadowLength !== undefined ? poly.shadowLength : '';
    } else {
      terrainShadowRow.style.display = 'none';
    }
    if (S.selLayer === 'hazard') {
      const poly = arr[S.selPoly];
      hazardRow.style.display = '';
      document.getElementById('hazard-type-select').value = poly.type || 'zone';
      
      const colorRow = document.getElementById('hazard-color-row');
      if (poly.type !== 'zone') {
        colorRow.style.display = '';
        document.getElementById('hazard-color').value = poly.color || '#ff0000';
        document.getElementById('hazard-bg').checked = !!poly.behindTerrain;
      } else {
        colorRow.style.display = 'none';
      }

      timingRow.style.display = (poly.type === 'laser' || poly.type === 'incinerator') ? '' : 'none';
      swTimingRow.style.display = poly.type === 'sandworm' ? '' : 'none';
      repRow.style.display = poly.type === 'repulsor' ? '' : 'none';
      gwRow.style.display = poly.type === 'gravwell' ? '' : 'none';
      crusherRow.style.display = poly.type === 'crusher' ? '' : 'none';

      if (poly.type === 'laser' || poly.type === 'incinerator') {
        document.getElementById('laser-onms').value = poly.onMs ?? 1500;
        document.getElementById('laser-offms').value = poly.offMs ?? 1000;
        document.getElementById('laser-phase').value = poly.phaseOffset ?? 0;
        document.getElementById('laser-warn').value = poly.warnMs ?? 800;
        document.getElementById('laser-dmg').value = poly.damagePerSec ?? 40;
        document.getElementById('laser-thick').value = poly.thickness ?? 15;
      } else if (poly.type === 'sandworm') {
        document.getElementById('sw-spawnrate').value = poly.spawnRate ?? 1.0;
        document.getElementById('sw-reach').value = poly.reach ?? 300;
        document.getElementById('sw-prox').value = poly.proximityScale ?? 0;
      } else if (poly.type === 'repulsor') {
        document.getElementById('rep-fx').value = poly.travelX ?? 0;
        document.getElementById('rep-fy').value = poly.travelY ?? -15;
      } else if (poly.type === 'gravwell') {
        document.getElementById('gw-speed').value = poly.speed ?? 100;
        document.getElementById('gw-radius').value = poly.radius ?? 200;
        document.getElementById('gw-startf').value = poly.startForce ?? 1.5;
        document.getElementById('gw-endf').value = poly.endForce ?? 0;
      } else if (poly.type === 'crusher') {
        document.getElementById('crush-waitu').value = poly.waitUnloadedMs ?? 1000;
        document.getElementById('crush-crush').value = poly.crushMs ?? 200;
        document.getElementById('crush-waitl').value = poly.waitLoadedMs ?? 500;
        document.getElementById('crush-retract').value = poly.retractMs ?? 1500;
        document.getElementById('crush-thick').value = poly.thickness ?? 40;
      }
    } else {
        hazardRow.style.display = 'none';
        timingRow.style.display = 'none';
        swTimingRow.style.display = 'none';
        repRow.style.display = 'none';
        gwRow.style.display = 'none';
        crusherRow.style.display = 'none';
    }
    
    if (waterRow) {
      if (S.selLayer === 'water') {
        waterRow.style.display = 'flex';
        document.getElementById('water-hasboat').checked = !!arr[S.selPoly].hasBoat;
        document.getElementById('water-hasfish').checked = !!arr[S.selPoly].hasFish;
      } else {
        waterRow.style.display = 'none';
      }
    }
    
    renderPtList();
  } else {
    hazardRow.style.display = 'none';
    timingRow.style.display = 'none';
    if (waterRow) waterRow.style.display = 'none';
    if (crusherRow) crusherRow.style.display = 'none';
  }
  document.getElementById('pdisp').textContent =
    hasPoly ? `${S.selLayer} ${S.selPoly+1}/${arr.length}` + (S.selPt>=0?`  pt ${S.selPt}`:'') : '';
}

function renderPtList() {
  const arr = activeList();
  const pi = S.selPoly;
  if (pi<0 || pi>=arr.length) return;
  const poly = arr[pi];
  const container = document.getElementById('pt-list');
  container.innerHTML = '';
  poly.pts.forEach((pt, i) => {
    const row = document.createElement('div');
    row.className = 'ptrow'+(i===S.selPt?' sel':'');
    row.innerHTML =
      `<span class="pidx">${i}</span>` +
      `<span class="clabel">x</span><input class="cinput" type="number" value="${Math.round(pt.x)}" onchange="setPt(${pi},${i},'x',this.value)" onclick="event.stopPropagation()">` +
      `<span class="clabel">y</span><input class="cinput" type="number" value="${Math.round(pt.y)}" onchange="setPt(${pi},${i},'y',this.value)" onclick="event.stopPropagation()">` +
      (S.selLayer === 'terrain' ? `<label title="Make edge invisible (stops glowing edge rendering)" style="margin-left:4px; font-size:9px; color:#8b949e" onclick="event.stopPropagation()"><input type="checkbox" ${pt.invisibleEdge?'checked':''} onchange="setPt(${pi},${i},'invisibleEdge',this.checked)"> inv.</label>` : '') +
      (S.selLayer === 'terrain' ? `<select title="Edge hazard between this point and the next" style="margin-left:4px; font-size:9px; background:#161b22; color:#c9d1d9; border:1px solid #30363d" onclick="event.stopPropagation()" onchange="setPt(${pi},${i},'edgeHazard',this.value)">` +
        `<option value=""${!pt.edgeHazard?' selected':''}>edge: normal</option>` +
        `<option value="spikes"${pt.edgeHazard==='spikes'?' selected':''}>edge: spikes</option>` +
        `</select>` : '') +
      `<span class="xbtn" style="margin-left:auto" onclick="deletePt(${pi},${i})">×</span>`;
    row.onclick = e => {
      if (e.target.tagName==='INPUT'||e.target.classList.contains('xbtn')) return;
      S.selPt=i; renderPtList(); renderSidebar(); draw();
    };
    container.appendChild(row);
  });
}

function toggleHide(pi, e) {
  e.stopPropagation();
  snapshot();
  const arr = activeList();
  arr[pi].hidden = !arr[pi].hidden;
  renderSidebar(); draw();
}

function toggleLock(pi, e) {
  e.stopPropagation();
  snapshot();
  const arr = activeList();
  arr[pi].locked = !arr[pi].locked;
  renderSidebar(); draw();
}

function renameActivePoly(val) {
  snapshot();
  if (S.selPoly>=0) activeList()[S.selPoly].comment = val;
  renderSidebar(); updateOut();
}

function setHazardType(val) {
  snapshot();
  if (S.selLayer !== 'hazard' || S.selPoly<0) return;
  const poly = activeList()[S.selPoly];
  poly.type = val;
  if (val === 'laser' || val === 'crusher') {
    if (poly.pts.length > 2) poly.pts = [poly.pts[0], poly.pts[1]];
    else if (poly.pts.length < 2) {
      const p0 = poly.pts[0] || {x:500,y:400};
      poly.pts = [p0, {x:p0.x+120,y:p0.y}];
    }
    if (val === 'laser') {
        if (poly.onMs === undefined) poly.onMs = 1500;
        if (poly.offMs === undefined) poly.offMs = 1000;
    }
  } else if (val === 'gravwell') {
    if (poly.pts.length < 2) {
      const p0 = poly.pts[0] || {x:500,y:400};
      poly.pts = [p0, {x:p0.x+120,y:p0.y}];
    }
    if (poly.speed === undefined) poly.speed = 100;
    if (poly.radius === undefined) poly.radius = 200;
    if (poly.startForce === undefined) poly.startForce = 1.5;
    if (poly.endForce === undefined) poly.endForce = 0;
  } else if (val === 'pickup') {
    if (poly.pts.length > 1) poly.pts = [poly.pts[0]];
    else if (poly.pts.length < 1) poly.pts = [{x:500,y:400}];
  } else if (val === 'sandworm') {
    let cx = 500, cy = 400;
    if (poly.pts.length > 0) {
      cx = poly.pts.reduce((s,p) => s + p.x, 0) / poly.pts.length;
      cy = poly.pts.reduce((s,p) => s + p.y, 0) / poly.pts.length;
    }
    const r = 20;
    poly.pts = [
      {x: cx, y: cy - r},
      {x: cx - r*0.866, y: cy + r*0.5},
      {x: cx + r*0.866, y: cy + r*0.5}
    ];
    if (poly.spawnRate === undefined) poly.spawnRate = 1.0;
    if (poly.reach === undefined) poly.reach = 300;
    if (poly.proximityScale === undefined) poly.proximityScale = 0;
  } else if (poly.pts.length < 3) {
    const p0 = poly.pts[0] || {x:500,y:400};
    const p1 = poly.pts[1] || {x:p0.x+80,y:p0.y};
    poly.pts = [p0, p1, {x:(p0.x+p1.x)/2, y:p0.y-80}];
  }
  S.selPt = -1;
  renderSidebar(); renderPtList(); draw(); updateOut();
}

function setTerrainShadow(field, val) {
  snapshot();
  const arr = activeList();
  if (!arr.length || S.selPoly < 0 || S.selLayer !== 'terrain') return;
  const poly = arr[S.selPoly];
  if (field === 'enabled') {
    if (val === true) delete poly.shadowEnabled;
    else poly.shadowEnabled = false;
  } else if (field === 'angle') {
    if (val === '' || val === '0') delete poly.shadowAngle;
    else poly.shadowAngle = +val;
  } else if (field === 'length') {
    if (val === '' || val === '60') delete poly.shadowLength;
    else poly.shadowLength = +val;
  }
  updateOut(); draw();
}

function setHazardField(field, val) {
  snapshot();
  const arr = activeList();
  if (S.selLayer!=='hazard' || S.selPoly<0 || S.selPoly>=arr.length) return;
  if (['onMs','offMs','phaseOffset','warnMs','damagePerSec','thickness','spawnRate','travelX','travelY','speed','radius','startForce','endForce','waitUnloadedMs','crushMs','waitLoadedMs','retractMs'].includes(field)) val = parseFloat(val)||0;
  arr[S.selPoly][field] = val;
  draw(); updateOut();
}

function setWaterField(field, val) {
  snapshot();
  const arr = activeList();
  if (S.selLayer!=='water' || S.selPoly<0 || S.selPoly>=arr.length) return;
  arr[S.selPoly][field] = val;
  renderSidebar(); draw(); updateOut();
}

function setPt(pi, pti, axis, val) {
  snapshot();
  const poly = activeList()[pi];
  if (axis === 'invisibleEdge') {
    if (val) poly.pts[pti][axis] = true;
    else delete poly.pts[pti][axis];
  } else if (axis === 'edgeHazard') {
    if (val) poly.pts[pti][axis] = val;
    else delete poly.pts[pti][axis];
  } else {
    if (S.selLayer === 'hazard' && poly.type === 'sandworm') {
        const oldVal = poly.pts[pti][axis];
        const delta = (+val) - oldVal;
        poly.pts.forEach(p => { p[axis] += delta; });
    } else {
        poly.pts[pti][axis] = +val;
    }
  }
  draw(); updateOut();
}

function deletePt(pi, pti) {
  snapshot();
  const arr = activeList();
  const isHazard = S.selLayer==='hazard';
  const type = arr[pi].type;
  const minPts = isHazard && (type==='laser' || type==='crusher') ? 2 : (isHazard && type==='pickup' ? 1 : (isHazard && type==='sandworm' ? 3 : 3));
  if (isHazard && type === 'sandworm') { alert('Cannot delete points from a fixed sandworm shape.'); return; }
  if (arr[pi].pts.length<=minPts) { alert(`Minimum ${minPts} points.`); return; }
  arr[pi].pts.splice(pti,1);
  if (S.selPt>=arr[pi].pts.length) S.selPt=arr[pi].pts.length-1;
  renderSidebar(); renderPtList(); draw(); updateOut();
}

function addShape() {
  snapshot();
  const cx=S.mouse.wx||500, cy=S.mouse.wy||400;
  const arr = activeList();
  let shape;
  if (S.selLayer === 'water') {
    shape = { pts:[{x:cx-100,y:cy},{x:cx+100,y:cy},{x:cx+100,y:cy+48},{x:cx-100,y:cy+48}], comment:'', hidden:false, hasBoat:false, hasFish:false };
  } else if (S.selLayer === 'hazard') {
    shape = { pts:[{x:cx-40,y:cy-40},{x:cx+40,y:cy-40},{x:cx+50,y:cy},{x:cx+40,y:cy+40},{x:cx-40,y:cy+40},{x:cx-50,y:cy}], comment:'', hidden:false, type:'zone' };
  } else if (S.selLayer === 'segments') {
    shape = { pts:[{x:cx-50,y:cy},{x:cx+50,y:cy}], comment:'New segment', hidden:false };
  } else {
    shape = { pts:[{x:cx-60,y:cy},{x:cx+60,y:cy},{x:cx,y:cy-100}], comment:'New polygon', hidden:false };
  }
  arr.push(shape);
  S.selPoly=arr.length-1; S.selPt=-1;
  renderSidebar(); draw(); updateOut();
}

function toggleCollectionPoint() {
  snapshot();
  if (S.collectionX == null) {
    S.collectionX = snap(S.mouse.wx || 500);
  } else {
    S.collectionX = null;
  }
  draw(); updateOut();
}

function addDeliveryHub() {
  snapshot();
  const cx = snap(S.mouse.wx || 500);
  S.hubs.push({ x: cx, color: "#38bdf8", type: "normal", name: "New Hub" }); updateHubUI();
  draw(); updateOut();
}

function setMarkerCoord(which, axis, val) {
  snapshot();
  if (which === 'hq') {
    if (axis === 'x') S.startX = +val;
    else S.startY = (val === '' || val == null) ? null : +val;
  } else {
    if (axis === 'x') S.collectionX = +val;
    else S.collectionY = (val === '' || val == null) ? null : +val;
  }
  draw(); updateOut();
}

function clearMarkerY(which) {
  snapshot();
  if (which === 'hq') { S.startY = null; document.getElementById('hq-y').value = ''; }
  else { S.collectionY = null; document.getElementById('cargo-y').value = ''; }
  draw(); updateOut();
}

function updateEntityPanel() {
  document.getElementById('hq-x').value = S.startX;
  document.getElementById('hq-y').value = S.startY != null ? S.startY : '';
  const cargoRow = document.getElementById('cargo-entity-row');
  if (S.collectionX != null) {
    cargoRow.style.display = '';
    document.getElementById('cargo-x').value = S.collectionX;
    document.getElementById('cargo-y').value = S.collectionY != null ? S.collectionY : '';
  } else {
    cargoRow.style.display = 'none';
  }
}

function deletePoly(confirmed = false) {
  const arr = activeList();
  if (S.selPoly<0) return;
  if (!confirmed) {
    document.getElementById('confirm-modal').style.display = 'flex';
    return;
  }
  snapshot();
  arr.splice(S.selPoly,1);
  S.selPoly=Math.min(S.selPoly,arr.length-1); S.selPt=-1;
  renderSidebar(); draw(); updateOut();
  closeConfirmModal();
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').style.display = 'none';
}

function toggleMapSettings() {
  const modal = document.getElementById('map-settings-modal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function insertAtCursor() {
  snapshot();
  const arr = activeList();
  if (S.selPoly<0) return;
  const poly = arr[S.selPoly];
  if (S.selLayer==='hazard' && poly.type==='laser') return; // laser is a fixed 2-point line
  const idx = nearestEdge(poly.pts, S.mouse.wx, S.mouse.wy);
  const proj = projectOntoSeg(S.mouse.wx, S.mouse.wy, poly.pts[idx], poly.pts[(idx+1)%poly.pts.length]);
  poly.pts.splice(idx+1, 0, {x:snap(proj.x), y:snap(proj.y)});
  S.selPt = idx+1;
  renderSidebar(); renderPtList(); draw(); updateOut();
}

// ── Export ──
function downloadJS() {
  const jsonStr = buildOut();
  const fileContent = jsonStr;
  const blob = new Blob([fileContent], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "custom_level.js";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function playtestLevel() {
  const jsonStr = buildOut();
  sessionStorage.setItem('playtest_level', jsonStr);
  window.location.href = 'index.html?playtest=1';
}

function buildOut() {
  const lines = [];
  lines.push(`registerLevel({`);
  lines.push(`  name: ${JSON.stringify(S.cfg.name || 'level')},`);
  // Everything else in the Metadata panel is emitted straight from the
  // schema: required fields (gravity/deposit/timeLimit/targetCargo) always,
  // booleans only when true, stringLists only when non-empty, other optional
  // scalars only when non-empty/non-zero — mirrors what the hand-written
  // per-field version above used to do, one field at a time.
  LEVEL_SCHEMA.fields.forEach(f => {
    if (META_EXCLUDE_KEYS.includes(f.key) || f.key === 'name') return;
    if (f.key === 'padScale') { if (S.padScale !== 1) lines.push(`  padScale: ${S.padScale},`); return; }
    const v = S.cfg[f.key];
    let emit;
    if (f.type === 'boolean') emit = !!v !== !!f.default; // emit only the non-default state, whichever way that goes
    else if (f.type === 'stringList') emit = Array.isArray(v) && v.length > 0;
    else if (f.required) emit = true;
    // Compare against the schema default rather than truthiness — fields
    // whose default isn't 0/''/null (e.g. ambientTrafficRate defaults to 1)
    // need their falsy-but-meaningful overrides (0 = "no traffic") emitted,
    // which a bare `!!v` check would silently drop.
    else emit = v !== undefined && v !== null && v !== f.default;
    if (!emit) return;
    if (f.type === 'string' || f.type === 'stringList') lines.push(`  ${f.key}: ${JSON.stringify(v)},`);
    else lines.push(`  ${f.key}: ${v},`);
  });

  lines.push(`  startX: ${S.startX},`);
  if (S.startY != null) lines.push(`  startY: ${S.startY},`);
  if (S.hqWidth != null) lines.push(`  startDepotWidth: ${S.hqWidth},`);
  
  if (S.collectionX != null) {
    lines.push(`  collectionX: ${S.collectionX},`);
    if (S.collectionY != null) lines.push(`  collectionY: ${S.collectionY},`);
    if (S.cargoWidth != null) lines.push(`  collectionWidth: ${S.cargoWidth},`);
  }

  // Quests
  const qLines = [];
  if (S.quests.primary) qLines.push(`questPrimary(${JSON.stringify(S.quests.primary)})`);
  if (S.quests.nocrash) qLines.push(S.quests.nocrashReward != null ? `questNoCrash(${S.quests.nocrashReward})` : `questNoCrash()`);
  if (S.quests.nocargo) qLines.push(S.quests.nocargoReward != null ? `questNoCargoLost('No cargo lost', ${S.quests.nocargoReward})` : `questNoCargoLost()`);
  if (S.quests.quick) qLines.push(S.quests.quickReward != null ? `questQuick("Complete under ${S.quests.quick}s", ${S.quests.quick}, ${S.quests.quickReward})` : `questQuick("Complete under ${S.quests.quick}s", ${S.quests.quick})`);
  if (S.quests.worm) qLines.push(S.quests.wormReward != null ? `questSurviveWorm(${S.quests.wormReward})` : `questSurviveWorm()`);
  if (qLines.length > 0) {
    lines.push(`  quests: [`);
    lines.push(`    ${qLines.join(',\n    ')}`);
    lines.push(`  ],`);
  }

  // Palette
  if (S.palette) {
    lines.push(`  palette: {`);
    ['skyTop','skyMid','skyBot','terrainFill','rockEdge','rockGlow','fog'].forEach(k => {
      if (S.palette[k]) lines.push(`    ${k}: ${JSON.stringify(S.palette[k])},`);
    });
    lines.push(`  },`);
  }

  // OOB
  if (S.oob) {
    if (S.oobIsBoolean) {
      lines.push(`  outOfBounds: true,`);
    } else {
      lines.push(`  outOfBounds: {`);
      Object.entries(S.oob).forEach(([k,v]) => {
        if (v != null && v !== '') lines.push(`    ${k}: ${typeof v === 'string' ? JSON.stringify(v) : v},`);
      });
      lines.push(`  },`);
    }
  }

  // World Bounds
  if (S.worldBounds) {
    lines.push(`  worldBounds: {`);
    Object.entries(S.worldBounds).forEach(([k,v]) => {
      if (v == null || v === '') return;
      lines.push(`    ${k}: ${typeof v === 'string' ? JSON.stringify(v) : v},`);
    });
    lines.push(`  },`);
  }

  // Radar Ping Zone
  if (S.radarZone) {
    lines.push(`  radarPingZone: {`);
    Object.entries(S.radarZone).forEach(([k,v]) => {
      if (v == null || v === '') return;
      lines.push(`    ${k}: ${typeof v === 'string' ? JSON.stringify(v) : v},`);
    });
    lines.push(`  },`);
  }

  // Wind Gust Cycle
  if (S.windGust) {
    lines.push(`  windGust: {`);
    Object.entries(S.windGust).forEach(([k,v]) => {
      if (v == null || v === '') return;
      lines.push(`    ${k}: ${typeof v === 'string' ? JSON.stringify(v) : v},`);
    });
    lines.push(`  },`);
  }

  if (S.hubs.length) {
    lines.push('  deliveryHubs: [');
    S.hubs.forEach((h,i) => {
      const fields = Object.entries(h)
        .map(([k,v]) => `${k}: ${typeof v==='string'?JSON.stringify(v):v}`)
        .join(', ');
      lines.push(`    { ${fields} }${i<S.hubs.length-1?',':''}`);
    });
    lines.push('  ],');
  }
  
  if (S.collectibles.length) {
    lines.push('  collectibles: [');
    S.collectibles.forEach((c,i) => {
      const fields = Object.entries(c)
        .map(([k,v]) => `${k}: ${typeof v==='string'?JSON.stringify(v):v}`)
        .join(', ');
      lines.push(`    { ${fields} }${i<S.collectibles.length-1?',':''}`);
    });
    lines.push('  ],');
  }

  if (S.waterPolys.length) {
    lines.push('  waterBodies: [');
    S.waterPolys.forEach((wb, i) => {
      if (wb.comment) lines.push(`    // ${wb.comment}`);
      lines.push('    {');
      lines.push(`      hasBoat: ${!!wb.hasBoat},`);
      lines.push(`      hasFish: ${!!wb.hasFish},`);
      lines.push('      pts: [');
      wb.pts.forEach((pt,pi) => lines.push(`        {x: ${Math.round(pt.x)}, y: ${Math.round(pt.y)}}${pi<wb.pts.length-1?',':''}`));
      lines.push('      ]');
      lines.push(`    }${i<S.waterPolys.length-1?',':''}`);
    });
    lines.push('  ],');
  }

  if (S.hazardPolys.length) {
    lines.push('  hazards: [');
    S.hazardPolys.forEach((h, i) => {
      if (h.comment) lines.push(`    // ${h.comment}`);
      lines.push('    {');
      lines.push(`      type: ${JSON.stringify(h.type||'zone')},`);
      if (h.type === 'laser' || h.type === 'incinerator') {
        if (h.onMs !== undefined) lines.push(`      onMs: ${h.onMs},`);
        else lines.push(`      onMs: 1500,`);
        if (h.offMs !== undefined) lines.push(`      offMs: ${h.offMs},`);
        else lines.push(`      offMs: 1000,`);
        if (h.phaseOffset) lines.push(`      phaseOffset: ${h.phaseOffset},`);
        if (h.warnMs) lines.push(`      warnMs: ${h.warnMs},`);
        if (h.damagePerSec) lines.push(`      damagePerSec: ${h.damagePerSec},`);
        if (h.type === 'laser' && h.thickness) lines.push(`      thickness: ${h.thickness},`);
      } else if (h.type === 'sandworm') {
        if (h.spawnRate !== undefined) lines.push(`      spawnRate: ${h.spawnRate},`);
      } else if (h.type === 'gravwell') {
        if (h.speed !== undefined) lines.push(`      speed: ${h.speed},`);
        if (h.radius !== undefined) lines.push(`      radius: ${h.radius},`);
        if (h.startForce !== undefined) lines.push(`      startForce: ${h.startForce},`);
        if (h.endForce !== undefined) lines.push(`      endForce: ${h.endForce},`);
      } else if (h.type === 'crusher') {
        if (h.waitUnloadedMs !== undefined) lines.push(`      waitUnloadedMs: ${h.waitUnloadedMs},`);
        if (h.crushMs !== undefined) lines.push(`      crushMs: ${h.crushMs},`);
        if (h.waitLoadedMs !== undefined) lines.push(`      waitLoadedMs: ${h.waitLoadedMs},`);
        if (h.retractMs !== undefined) lines.push(`      retractMs: ${h.retractMs},`);
        if (h.thickness !== undefined) lines.push(`      thickness: ${h.thickness},`);
      }
      if (h.behindTerrain) lines.push(`      behindTerrain: true,`);
      if (h.color) lines.push(`      color: ${JSON.stringify(h.color)},`);
      lines.push('      pts: [');
      h.pts.forEach((pt,pi) => lines.push(`        {x: ${Math.round(pt.x)}, y: ${Math.round(pt.y)}}${pi<h.pts.length-1?',':''}`));
      lines.push('      ]');
      lines.push(`    }${i<S.hazardPolys.length-1?',':''}`);
    });
    lines.push('  ],');
  }

  if (S.segments.length) {
    lines.push('  segments: [');
    S.segments.forEach((seg, i) => {
      if (!seg.pts || seg.pts.length < 2) return;
      lines.push(`    { x1: ${Math.round(seg.pts[0].x)}, y1: ${Math.round(seg.pts[0].y)}, x2: ${Math.round(seg.pts[1].x)}, y2: ${Math.round(seg.pts[1].y)} }${i<S.segments.length-1?',':''}`);
    });
    lines.push('  ],');
  }

  lines.push('  terrainPolygons: [');
  S.polygons.forEach((poly, pi) => {
    if (poly.comment) lines.push(`    // ${poly.comment}`);
    const hasShadowProps = poly.shadowEnabled !== undefined || poly.shadowAngle !== undefined || poly.shadowLength !== undefined;
    if (hasShadowProps) {
        lines.push('    {');
        const props = [];
        if (poly.shadowEnabled !== undefined) props.push(`shadowEnabled: ${poly.shadowEnabled}`);
        if (poly.shadowAngle !== undefined) props.push(`shadowAngle: ${poly.shadowAngle}`);
        if (poly.shadowLength !== undefined) props.push(`shadowLength: ${poly.shadowLength}`);
        lines.push(`      ${props.join(', ')},`);
        lines.push('      pts: [');
    } else {
        lines.push('    [');
    }
    
    poly.pts.forEach((pt,i) => {
      const extra = (pt.invisibleEdge ? ', invisibleEdge: true' : '') +
        (pt.edgeHazard ? `, edgeHazard: ${JSON.stringify(pt.edgeHazard)}` : '');
      lines.push(`        {x: ${Math.round(pt.x)}, y: ${Math.round(pt.y)}${extra}}${i<poly.pts.length-1?',':''}`);
    });
    
    if (hasShadowProps) {
        lines.push(`      ]`);
        lines.push(`    }${pi<S.polygons.length-1?',':''}`);
    } else {
        lines.push(`    ]${pi<S.polygons.length-1?',':''}`);
    }
  });
  lines.push('  ]');
  lines.push('});');
  return lines.join('\n');
}


function updateOut() {
  document.getElementById('out').value = buildOut();
  scheduleLiveLevelSync(); // hot-reload the live engine preview, debounced
}

function copyOut() {
  navigator.clipboard.writeText(document.getElementById('out').value).then(() => {
    const b = document.getElementById('copy-btn');
    b.textContent='Copied!'; setTimeout(()=>b.textContent='Copy',1400);
  });
}

function copyWithAIPrompt() {
  const levelCode = document.getElementById('out').value;
  const prompt = `I am working on a level for a lunar lander game. 
Here is the current code for the level:

\`\`\`javascript
${levelCode}
\`\`\`

Please help me update this level. 
When you provide the updated level code, please provide ONLY the complete \`registerLevel({...})\` call in a single javascript code block, so I can easily copy and paste it back into my level editor. Do not explain every little change unless I ask. Make sure the output is syntactically valid.

My requested changes are: [TYPE YOUR CHANGES HERE]`;

  navigator.clipboard.writeText(prompt).then(() => {
    const b = document.getElementById('copy-ai-btn');
    const oldText = b.textContent;
    b.textContent='Copied Prompt!'; 
    setTimeout(()=>b.textContent=oldText,1400);
  });
}

// ── Mouse ─────────────────────────────────────────────────────────────────────
const HIT = 10;
let isPan=false, panLast=null;

// Scans hazard/water layers before terrain so smaller, sparser shapes are
// easier to grab even when they overlap a dense terrain polygon underneath.
function hitPoint(sx,sy) {
  const layers = [['hazard',S.hazardPolys], ['water',S.waterPolys], ['terrain',S.polygons]];
  for (const [layer, arr] of layers) {
    for (let pi=arr.length-1; pi>=0; pi--) {
      if (arr[pi].hidden || arr[pi].locked) continue;
      for (let pti=0; pti<arr[pi].pts.length; pti++) {
        const {sx:px,sy:py} = w2s(arr[pi].pts[pti].x, arr[pi].pts[pti].y);
        if (Math.hypot(sx-px,sy-py)<HIT) return [layer,pi,pti];
      }
    }
  }
  return null;
}

function hitMarker(sx, sy) {
  const HIT_R = 14;
  // Spawn markers: diamond at Y override or terrain surface, or fallback triangle at top
  const checkSpawn = (worldX, worldY, key, width) => {
    const gy = (worldY != null) ? worldY : groundYAt(worldX);
    if (gy !== null) {
      const {sx:mx, sy:my} = w2s(worldX, gy);
      const {sx:rx} = w2s(worldX + width, gy);
      // Check both the diamond area and the pad area
      if ((sx >= mx - HIT_R && sx <= rx + HIT_R && sy >= my - 22 && sy <= my + HIT_R) || Math.hypot(sx-mx, sy-my) < HIT_R) return key;
    } else {
      const {sx:mx} = w2s(worldX, 0);
      if (Math.abs(sx-mx) < HIT_R && sy > 30 && sy < 68) return key;
    }
    return null;
  };
  let r;
  if ((r = checkSpawn(S.startX, S.startY, 'hq', S.hqWidth || (80 * S.padScale)))) return r;
  if (S.collectionX != null && (r = checkSpawn(S.collectionX, S.collectionY, 'depot', S.cargoWidth || (100 * S.padScale)))) return r;

  // Hubs: pad line on terrain or fallback bar at top
  for (let i=0; i<S.hubs.length; i++) {
    const hub = S.hubs[i];
    const padHalfWpx = (hub.width || 80*S.padScale) * S.view.scale / 2;
    const gy = (hub.y != null) ? hub.y : groundYAt(hub.x);
    if (gy !== null) {
      const {sx:cx, sy:cy} = w2s(hub.x, gy);
      if (sx >= cx-padHalfWpx-8 && sx <= cx+padHalfWpx+8 && sy >= cy-22 && sy <= cy+8) return {hub:i};
    } else {
      const {sx:cx} = w2s(hub.x, 0);
      if (sx >= cx-padHalfWpx-8 && sx <= cx+padHalfWpx+8 && sy > 3 && sy < 38) return {hub:i};
    }
  }

  // Collectibles: free-floating circular token at {x,y}
  for (let i=0; i<S.collectibles.length; i++) {
    const item = S.collectibles[i];
    const def = window.COLLECTIBLE_TYPES && window.COLLECTIBLE_TYPES[item.type];
    const itemR = (item.radius || def?.radius || 24) * S.view.scale;
    const {sx:cx, sy:cy} = w2s(item.x, item.y);
    if (Math.hypot(sx-cx, sy-cy) < Math.max(itemR, HIT_R)) return {collectible:i};
  }

  return null;
}

canvas.addEventListener('mousedown', e => {
  const sx=e.offsetX, sy=e.offsetY;
  const {wx,wy} = s2w(sx,sy);
  S.mouse.wx=wx; S.mouse.wy=wy;

  if (S.mode==='pan'||e.button===1||e.altKey) {
    isPan=true; panLast={sx,sy}; canvas.style.cursor='grabbing'; return;
  }
  if (S.mode==='add'&&e.button===0&&S.selPoly>=0) {
    snapshot();
    const poly=activeList()[S.selPoly];
    if (S.selLayer==='hazard' && poly.type==='laser') return; // laser is a fixed 2-point line
    const idx=nearestEdge(poly.pts,wx,wy);
    const proj=projectOntoSeg(wx,wy,poly.pts[idx],poly.pts[(idx+1)%poly.pts.length]);
    poly.pts.splice(idx+1,0,{x:snap(proj.x),y:snap(proj.y)});
    S.selPt=idx+1; S.edgePreview=null;
    renderSidebar(); renderPtList(); draw(); updateOut(); return;
  }
  if ((S.mode==='select-pt' || S.mode==='select-poly')&&e.button===0) {
    // Marker drag takes priority over polygon points
    const mhit = hitMarker(sx, sy);
    if (mhit) { snapshot(); S.dragMarker=mhit; return; }

    const hit=hitPoint(sx,sy);
    if (hit) {
      snapshot();
      const [layer,pi,pti]=hit;
      if (layer !== S.selLayer) { S.selLayer = layer; syncLayerButtonsUI(); }
      S.selPoly=pi; S.selPt=pti; S.dragging=true; S.dragLayer=layer; S.dragPi=pi; S.dragPti=pti;
      renderSidebar(); renderPtList(); draw();
    } else {
      const layers = [['hazard',S.hazardPolys], ['water',S.waterPolys], ['terrain',S.polygons]];
      for (const [layer,arr] of layers) {
        for (let pi=arr.length-1;pi>=0;pi--) {
          if (!arr[pi].hidden&&!arr[pi].locked&&inPoly(wx,wy,arr[pi].pts)) {
            snapshot();
            if (layer !== S.selLayer) { S.selLayer = layer; syncLayerButtonsUI(); }
            S.selPoly=pi; S.selPt=-1;
            // Start whole-polygon body drag
            if (S.mode === 'select-poly') {
              S.dragPolyBody = { layer, pi, startWx:wx, startWy:wy, origPts:arr[pi].pts.map(p=>({...p})) };
            }
            renderSidebar(); renderPtList(); draw(); return;
          }
        }
      }
    }
  }
});

canvas.addEventListener('mousemove', e => {
  const sx=e.offsetX, sy=e.offsetY;
  const {wx,wy}=s2w(sx,sy);
  S.mouse.wx=wx; S.mouse.wy=wy;
  document.getElementById('sx').textContent=Math.round(wx);
  document.getElementById('sy').textContent=Math.round(wy);

  if (isPan&&panLast) {
    S.view.x+=sx-panLast.sx; S.view.y+=sy-panLast.sy; panLast={sx,sy}; draw(); return;
  }

  // Dragging a spawn marker or hub
  if (S.dragMarker) {
    const s=e.shiftKey?S.snap*5:S.snap;
    const snappedX=Math.round(wx/s)*s;
    const snappedY=Math.round(wy/s)*s;
    if (S.dragMarker==='hq') {
      S.startX=snappedX;
      S.startY=snappedY;
      updateEntityPanel();
    } else if (S.dragMarker==='depot') {
      S.collectionX=snappedX;
      S.collectionY=snappedY;
      updateEntityPanel();
    } else if (S.dragMarker.hub!=null) {
      S.hubs[S.dragMarker.hub].x=snappedX;
      S.hubs[S.dragMarker.hub].y=snappedY;
      updateHubCoords();
    } else if (S.dragMarker.collectible!=null) {
      S.collectibles[S.dragMarker.collectible].x=snappedX;
      S.collectibles[S.dragMarker.collectible].y=snappedY;
      updateCollectibleCoords();
    }
    draw(); updateOut(); return;
  }

  // Dragging a whole polygon body
  if (S.dragPolyBody) {
    const rawDx = wx - S.dragPolyBody.startWx;
    const rawDy = wy - S.dragPolyBody.startWy;
    const poly = listForLayer(S.dragPolyBody.layer)[S.dragPolyBody.pi];
    poly.pts = S.dragPolyBody.origPts.map(p => ({x:snap(p.x+rawDx), y:snap(p.y+rawDy)}));
    renderPtList(); draw(); updateOut(); return;
  }

  // Dragging a shape vertex (terrain, water, or hazard — same mechanism for all three)
  if (S.dragging&&S.dragPti>=0) {
    const s=e.shiftKey?S.snap*5:S.snap;
    const poly=listForLayer(S.dragLayer)[S.dragPi];
    if (S.dragLayer === 'hazard' && poly.type === 'sandworm') {
        const pt=poly.pts[S.dragPti];
        const dx = Math.round(wx/s)*s - pt.x;
        const dy = Math.round(wy/s)*s - pt.y;
        poly.pts.forEach(p => { p.x += dx; p.y += dy; });
    } else {
        const pt=poly.pts[S.dragPti];
        pt.x=Math.round(wx/s)*s; pt.y=Math.round(wy/s)*s;
    }
    renderPtList(); draw(); updateOut(); return;
  }

  // Edge preview in Add pts mode
  if (S.mode==='add'&&S.selPoly>=0&&S.selPoly<activeList().length) {
    const poly=activeList()[S.selPoly];
    if (!poly.hidden && poly.pts.length>=2) {
      const idx=nearestEdge(poly.pts,wx,wy);
      const proj=projectOntoSeg(wx,wy,poly.pts[idx],poly.pts[(idx+1)%poly.pts.length]);
      S.edgePreview={layer:S.selLayer, pi:S.selPoly, edgeIdx:idx, pt:{x:snap(proj.x),y:snap(proj.y)}};
      draw(); return;
    }
  } else if (S.edgePreview) {
    S.edgePreview=null; draw();
  }

  // Hover detection for marker cursor feedback
  const mhov = hitMarker(sx, sy);
  if (mhov !== S.hoverMarker) {
    S.hoverMarker = mhov;
    canvas.style.cursor = mhov ? 'move' : (S.mode==='pan'?'grab':S.mode==='add'?'crosshair':'default');
    draw();
  }
});

canvas.addEventListener('mouseup', () => {
  if (isPan){isPan=false;canvas.style.cursor=S.mode==='pan'?'grab':'default';}
  if (S.dragMarker) { S.dragMarker=null; }
  if (S.dragPolyBody) { S.dragPolyBody=null; }
  S.dragging=false; S.dragLayer=null; S.dragPi=-1; S.dragPti=-1;
});
canvas.addEventListener('mouseleave', () => {
  isPan=false; S.dragging=false; S.dragMarker=null; S.dragPolyBody=null; S.edgePreview=null; draw();
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const f=e.deltaY<0?1.15:1/1.15;
  const {wx,wy}=s2w(e.offsetX,e.offsetY);
  S.view.scale=Math.max(0.04,Math.min(4,S.view.scale*f));
  S.view.x=e.offsetX-wx*S.view.scale; S.view.y=e.offsetY-wy*S.view.scale;
  draw();
},{passive:false});

// Button-driven zoom (#zoom-controls) — same clamps as the wheel handler,
// anchored on the canvas centre. draw() propagates the new view to the live
// engine preview when it's open.
function zoomBy(f) {
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const {wx, wy} = s2w(cx, cy);
  S.view.scale = Math.max(0.04, Math.min(4, S.view.scale * f));
  S.view.x = cx - wx * S.view.scale;
  S.view.y = cy - wy * S.view.scale;
  draw();
}

// ── Keyboard ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    if (e.shiftKey) redo();
    else undo();
    e.preventDefault();
    return;
  }
  if (document.getElementById('confirm-modal').style.display === 'flex') {
    if (e.key === 'Escape') {
      closeConfirmModal();
      e.preventDefault();
    } else if (e.key === 'Enter') {
      deletePoly(true);
      e.preventDefault();
    }
    return;
  }
  const tag=e.target.tagName;
  if (tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
  if (e.key==='s') setMode(S.mode === 'select-pt' ? 'select-poly' : 'select-pt');
  if (e.key==='a') setMode('add');
  if (e.key==='p') setMode('pan');
  if (e.key==='f') fitView();
  if ((e.key==='Delete'||e.key==='Backspace')&&S.selPoly>=0) {
    if (S.selPt>=0) deletePt(S.selPoly, S.selPt);
    else deletePoly();
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const snap = v => Math.round(v/S.snap)*S.snap;

function inPoly(px,py,pts) {
  let inside=false;
  for (let i=0,j=pts.length-1;i<pts.length;j=i++) {
    const {x:xi,y:yi}=pts[i],{x:xj,y:yj}=pts[j];
    if (((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

function distToSeg(px,py,a,b) {
  const dx=b.x-a.x, dy=b.y-a.y, len2=dx*dx+dy*dy;
  if (len2===0) return Math.hypot(px-a.x,py-a.y);
  const t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/len2));
  return Math.hypot(px-(a.x+t*dx),py-(a.y+t*dy));
}

function projectOntoSeg(px,py,a,b) {
  const dx=b.x-a.x, dy=b.y-a.y, len2=dx*dx+dy*dy;
  if (len2===0) return {x:a.x,y:a.y};
  const t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/len2));
  return {x:a.x+t*dx, y:a.y+t*dy};
}

function nearestEdge(pts,wx,wy) {
  let best=0,bestD=Infinity;
  for (let i=0;i<pts.length;i++) {
    const d=distToSeg(wx,wy,pts[i],pts[(i+1)%pts.length]);
    if (d<bestD){bestD=d;best=i;}
  }
  return best;
}

// ── Headless verification hook ───────────────────────────────────────────────
// Mirrors probe-screenshot.html's query-string automation (see README's
// "Headless verification" section) so the load-parse-export round trip can be
// driven without clicking through the UI in an interactive browser:
//   level-editor.html?autoload=level4.js&dumpExport=1
// loads level4.js via the normal loadFromServer() path, then (once the
// injected script tag has finished, ~500ms later) appends a
// #headless-export-dump <pre> containing the export textarea's contents —
// grep the --dump-dom output for it to diff against the source file.

(function restorePlaytest() {
  const ptSrc = sessionStorage.getItem('playtest_level');
  if (ptSrc && !new URLSearchParams(location.search).get('autoload')) {
    applySource(ptSrc);
    sessionStorage.removeItem('playtest_level');
  }
})();
(function headlessAutoLoad() {
  const params = new URLSearchParams(location.search);
  const auto = params.get('autoload');
  if (!auto) return;
  document.getElementById('lsel').value = auto;
  loadFromServer();
  if (params.get('openPanels')) {
    document.querySelectorAll('#sidebar details').forEach(d => d.open = true);
  }
  // &preview=1 — switch to game-preview mode after the level loads, so a
  // headless --screenshot capture shows the drawGamePreview* rendering.
  // &hubstyle=house sets every hub's style first (visual spot checks).
  if (params.get('preview')) {
    setTimeout(() => {
      const hs = params.get('hubstyle');
      if (hs) { S.hubs.forEach(h => h.style = hs); }
      if (!S.previewMode) togglePreview();
      fitView();
    }, 600);
  }
  // &live=1 — open the live engine preview after the level loads (headless
  // visual checks of the editor↔engine embed).
  if (params.get('live')) {
    setTimeout(() => {
      fitView();
      if (!liveFrame) toggleLivePreview();
    }, 600);
  }
  if (params.get('dumpExport')) {
    setTimeout(() => {
      const pre = document.createElement('pre');
      pre.id = 'headless-export-dump';
      pre.textContent = document.getElementById('out').value;
      document.body.appendChild(pre);
    }, 500);
  }
})();

document.getElementById('confirm-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('confirm-modal')) {
    closeConfirmModal();
  }
});
// Map Settings Modal Dragging & Resizing
const mapModal = document.getElementById('map-settings-modal');
const mapHeader = document.getElementById('map-settings-header');
const mapResize = document.getElementById('map-settings-resize');

let mapModalState = { action: null, startX: 0, startY: 0, startLeft: 0, startTop: 0, startW: 0, startH: 0 };

mapHeader.addEventListener('mousedown', e => {
  if (e.target.id === 'map-settings-close') return;
  mapModalState = { action: 'drag', startX: e.clientX, startY: e.clientY, startLeft: mapModal.offsetLeft, startTop: mapModal.offsetTop };
});

mapResize.addEventListener('mousedown', e => {
  mapModalState = { action: 'resize', startX: e.clientX, startY: e.clientY, startW: mapModal.offsetWidth, startH: mapModal.offsetHeight };
  e.preventDefault();
});

// Sidebar Resizing
const sidebarEl = document.getElementById('sidebar');
const sidebarHandle = document.getElementById('sidebar-resize-handle');
let sidebarResizing = false;

sidebarHandle.addEventListener('mousedown', e => {
  sidebarResizing = true;
  sidebarHandle.classList.add('active');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});

window.addEventListener('mousemove', e => {
  if (sidebarResizing) {
    const newWidth = Math.max(220, Math.min(800, e.clientX));
    sidebarEl.style.width = newWidth + 'px';
    sidebarEl.style.minWidth = newWidth + 'px';
    
    // Auto-update the map-settings left offset so it stays relative to the sidebar
    if (mapModal) {
      mapModal.style.left = (newWidth + 40) + 'px';
    }
    
    resize(); // Trigger editor canvas redraw and width sync
  } else if (mapModalState.action === 'drag') {
    mapModal.style.left = Math.max(0, mapModalState.startLeft + e.clientX - mapModalState.startX) + 'px';
    mapModal.style.top = Math.max(0, mapModalState.startTop + e.clientY - mapModalState.startY) + 'px';
  } else if (mapModalState.action === 'resize') {
    mapModal.style.width = Math.max(300, mapModalState.startW + e.clientX - mapModalState.startX) + 'px';
    mapModal.style.height = Math.max(200, mapModalState.startH + e.clientY - mapModalState.startY) + 'px';
  }
});

window.addEventListener('mouseup', () => {
  if (sidebarResizing) {
    sidebarResizing = false;
    sidebarHandle.classList.remove('active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
  mapModalState.action = null;
});

// ── Game Preview Rendering ──────────────────────────────────────────────────
// previewPadBase mirrors drawPadBase() in render/entities.js — same 15px slab,
// chevron stripes, 3px accent bar and label position — so the editor preview
// matches the game 1:1 and HQ / Cargo / hub pads all render alike.
const PAD_H = 15;
function previewPadBase(x, y, w, accent, stripe, label, labelColor) {
  ctx.fillStyle = '#1e293b'; ctx.fillRect(x, y, w, PAD_H);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, PAD_H); ctx.clip();
  ctx.fillStyle = stripe;
  for (let sx2 = x - PAD_H; sx2 < x + w + PAD_H; sx2 += 26) {
    ctx.beginPath();
    ctx.moveTo(sx2, y + PAD_H); ctx.lineTo(sx2 + PAD_H, y);
    ctx.lineTo(sx2 + PAD_H + 13, y); ctx.lineTo(sx2 + 13, y + PAD_H);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = accent; ctx.fillRect(x, y, w, 3);
  if (label) {
    ctx.fillStyle = labelColor || 'rgba(255,255,255,0.7)';
    ctx.font = '600 10px Outfit, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x + w/2, y + 11);
  }
}

function drawGamePreviewHQ(x, y, w) {
  const hW = 120, hH = 90;
  const hX = x + w/2 - hW/2, hY = y - hH;
  ctx.save();
  const origin = w2s(0, 0); ctx.translate(origin.sx, origin.sy); ctx.scale(S.view.scale, S.view.scale);

  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.moveTo(hX, y); ctx.lineTo(hX, hY + 30); ctx.lineTo(hX + hW/2, hY);
  ctx.lineTo(hX + hW, hY + 30); ctx.lineTo(hX + hW, y); ctx.fill();
  
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(hX - 5, hY + 32); ctx.lineTo(hX + hW/2, hY - 2); ctx.lineTo(hX + hW + 5, hY + 32); ctx.stroke();

  previewPadBase(x, y, w, '#94a3b8', 'rgba(100,120,160,0.25)', 'HQ', 'rgba(255,255,255,0.5)');
  ctx.restore();
}

function drawGamePreviewCargo(x, y, w) {
  ctx.save();
  const origin = w2s(0, 0); ctx.translate(origin.sx, origin.sy); ctx.scale(S.view.scale, S.view.scale);

  const wbX = x - 18, wbW = w + 36, wbH = 80, wbY = y - wbH;
  ctx.fillStyle = '#0f1e2e'; ctx.fillRect(wbX, wbY, wbW, wbH);
  ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1.5; ctx.strokeRect(wbX, wbY, wbW, wbH);
  
  ctx.strokeStyle = 'rgba(30,58,94,0.8)'; ctx.lineWidth = 1;
  for (let rx = wbX + 12; rx < wbX + wbW - 4; rx += 12) {
    ctx.beginPath(); ctx.moveTo(rx, wbY + 4); ctx.lineTo(rx, wbY + wbH - 2); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(14, 165, 233, 0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(wbX, wbY); ctx.lineTo(wbX + wbW, wbY); ctx.stroke();
  
  const doorW = wbW * 0.32, doorH = wbH * 0.52;
  for (const dOff of [0.18, 0.57]) {
    const dx = wbX + wbW * dOff, dy = wbY + wbH - doorH;
    ctx.fillStyle = '#060e18'; ctx.fillRect(dx, dy, doorW, doorH);
    ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1.2; ctx.strokeRect(dx, dy, doorW, doorH);
    ctx.strokeStyle = 'rgba(56,189,248,0.6)'; ctx.lineWidth = 1;
    ctx.strokeRect(dx + 2, dy + 2, doorW - 4, doorH - 4);
  }

  const trackY = wbY - 2;
  const trackStartX = wbX + 10;
  const trackEndX = x + w * 0.9;
  
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(trackStartX, trackY - 18); ctx.lineTo(trackEndX, trackY - 18); ctx.stroke();
  
  ctx.lineWidth = 2;
  for (let sx = trackStartX + 10; sx <= trackEndX - 10; sx += 32) {
    ctx.beginPath(); ctx.moveTo(sx, trackY - 18); ctx.lineTo(sx, wbY); ctx.stroke();
  }
  ctx.lineCap = 'butt';

  const hatchX = wbX + wbW * 0.42;
  ctx.fillStyle = '#475569';
  ctx.fillRect(hatchX - 5, trackY - 18 - 4, 10, 7);
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(hatchX, trackY - 18); ctx.lineTo(hatchX, trackY - 18 + 14); ctx.stroke();
  
  previewPadBase(x, y, w, '#38bdf8', 'rgba(251,191,36,0.2)', 'CARGO', 'rgba(56,189,248,0.9)');
  ctx.fillStyle = 'rgba(14, 165, 233, 0.9)'; ctx.font = 'bold 9px Outfit, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('CARGO DEPOT', x + w/2, wbY + 14);
  ctx.restore();
}

function drawGamePreviewChute(x, y, w, color) {
  ctx.save();
  const origin = w2s(0, 0); ctx.translate(origin.sx, origin.sy); ctx.scale(S.view.scale, S.view.scale);

  const hh = 40;
  ctx.fillStyle = '#334155';
  ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + w + 20, y);
  ctx.lineTo(x + w, y + hh); ctx.lineTo(x, y + hh); ctx.fill();
  
  ctx.fillStyle = '#020617';
  ctx.beginPath(); ctx.moveTo(x - 10, y + 8); ctx.lineTo(x + w + 10, y + 8);
  ctx.lineTo(x + w - 4, y + hh - 4); ctx.lineTo(x + 4, y + hh - 4); ctx.fill();

  ctx.fillStyle = color; ctx.fillRect(x - 20, y, w + 40, 4);

  ctx.fillStyle = color; ctx.globalAlpha = 0.15;
  ctx.beginPath(); ctx.moveTo(x - 30, y - 80); ctx.lineTo(x + w + 30, y - 80);
  ctx.lineTo(x + w - 4, y); ctx.lineTo(x + 4, y); ctx.fill();
  
  ctx.restore();
}

// Hub preview — pad base + the selected background structure, mirroring the
// hub.style variants in render/entities.js (crane / house / depot / silo / none).
function drawGamePreviewHub(x, y, w, color, style, name) {
  ctx.save();
  const origin = w2s(0, 0); ctx.translate(origin.sx, origin.sy); ctx.scale(S.view.scale, S.view.scale);

  const hcx = x + w/2;
  const craneArmLeft = x - 6;

  if (style === 'crane' || !style) {
    const craneTopY = y - 66;
    const craneX = hcx + w * 0.28;
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(craneX, y); ctx.lineTo(craneX, craneTopY - 16); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(craneX, craneTopY - 16); ctx.lineTo(craneArmLeft, craneTopY - 16); ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.fillStyle = '#475569';
    ctx.fillRect(craneArmLeft + 20 - 5, craneTopY - 22, 10, 7);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(craneArmLeft + 20, craneTopY - 15); ctx.lineTo(craneArmLeft + 20, craneTopY - 15 + 22); ctx.stroke();
  } else if (style === 'repair') {
    const bw = Math.min(80, w * 0.9), bh = 16;
    const bx = hcx - bw/2, byTop = y - bh;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(bx + 6, byTop); ctx.lineTo(bx + bw - 6, byTop);
    ctx.lineTo(bx + bw, y); ctx.lineTo(bx, y);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bx + 10, byTop + 4, bw - 20, 6);
    ctx.fillStyle = '#10b981'; // glowing repair green
    ctx.fillRect(bx + 14, byTop + 6, bw - 28, 2);
  } else if (style === 'house') {
    const bw = Math.min(64, w * 0.85), bh = 42;
    const bx = hcx - bw/2, byTop = y - bh;
    ctx.fillStyle = '#1e293b'; ctx.fillRect(bx + bw - 16, byTop - 6, 7, 20); // chimney
    ctx.fillStyle = '#16233a'; ctx.fillRect(bx, byTop + 12, bw, bh - 12);
    ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1.2; ctx.strokeRect(bx, byTop + 12, bw, bh - 12);
    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx - 6, byTop + 14); ctx.lineTo(hcx, byTop - 6);
    ctx.lineTo(bx + bw + 6, byTop + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#060e18'; ctx.fillRect(hcx - 7, y - 17, 14, 17);
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(hcx - 7, y - 17, 14, 17);
    ctx.fillStyle = 'rgba(251,191,36,0.7)'; ctx.fillRect(bx + 8, byTop + 19, 11, 10);
  } else if (style === 'depot') {
    const bw = Math.min(96, w + 16), bh = 46;
    const bx = hcx - bw/2, byTop = y - bh;
    ctx.fillStyle = '#0f1e2e'; ctx.fillRect(bx, byTop, bw, bh);
    ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, byTop, bw, bh);
    ctx.strokeStyle = 'rgba(30,58,94,0.8)'; ctx.lineWidth = 1;
    for (let rx = bx + 10; rx < bx + bw - 4; rx += 10) {
      ctx.beginPath(); ctx.moveTo(rx, byTop + 4); ctx.lineTo(rx, y - 2); ctx.stroke();
    }
    const dW = bw * 0.4, dH = bh * 0.55;
    ctx.fillStyle = '#060e18'; ctx.fillRect(hcx - dW/2, y - dH, dW, dH);
    ctx.strokeStyle = '#1e3a5f'; ctx.strokeRect(hcx - dW/2, y - dH, dW, dH);
    ctx.strokeStyle = color; ctx.globalAlpha = 0.7; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx, byTop); ctx.lineTo(bx + bw, byTop); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (style === 'silo') {
    const sw2 = 30, sh = 58;
    const sx0 = hcx - sw2/2, top = y - sh;
    ctx.fillStyle = '#16233a'; ctx.fillRect(sx0, top + 10, sw2, sh - 10);
    ctx.strokeStyle = '#1e3a5f'; ctx.lineWidth = 1.2; ctx.strokeRect(sx0, top + 10, sw2, sh - 10);
    ctx.beginPath(); ctx.arc(hcx, top + 11, sw2/2, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#334155';
    ctx.beginPath(); ctx.moveTo(sx0 + sw2 + 3, y); ctx.lineTo(sx0 + sw2 + 3, top + 16); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(hcx, top - 6, 2.5, 0, Math.PI * 2); ctx.fill();
  } // 'none' → bare pad

  // Pallet stack target (all styles)
  const palletX = craneArmLeft - 16;
  ctx.fillStyle = '#78350f'; ctx.fillRect(palletX - 12, y - 4, 24, 4);

  previewPadBase(x, y, w, color, color + '40', (name || 'HUB').toUpperCase(), '#f8fafc');
  ctx.restore();
}
// Persist sidebar sections (details tags) state
document.querySelectorAll('#sidebar details').forEach((det, i) => {
  const summary = det.querySelector('summary');
  const title = summary ? summary.textContent.trim().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() : `sec-${i}`;
  const key = `cargo-editor-sec-${title}`;
  
  const saved = localStorage.getItem(key);
  if (saved !== null) {
    if (saved === 'true') {
      det.setAttribute('open', '');
    } else {
      det.removeAttribute('open');
    }
  }
  
  det.addEventListener('toggle', () => {
    localStorage.setItem(key, det.open);
  });
});

// ── Automated Tests (run if ?runTests=1) ────────────────────────────────────
if (new URLSearchParams(window.location.search).get('runTests') === '1') {
  window.addEventListener('load', () => {
    console.log("Starting automated tests...");
    let passed = 0;
    let failed = 0;
    
    function assertEq(act, exp, msg) {
      if (act !== exp) {
        console.error(`FAIL: ${msg} | Expected ${exp}, got ${act}`);
        failed++;
      } else {
        passed++;
      }
    }

    try {
      // 1. Initial State
      _undoStack.length = 0;
      _redoStack.length = 0;
      S.polygons = [];
      
      // 2. Perform a mutation
      S.mouse = { wx: 100, wy: 100 };
      S.selLayer = 'terrain';
      addShape(); // Creates a polygon
      
      assertEq(S.polygons.length, 1, "addShape() created a polygon");
      assertEq(_undoStack.length, 1, "addShape() pushed to undo stack");
      
      // 3. Perform another mutation
      S.mouse = { wx: 200, wy: 200 };
      addShape(); // Creates a second polygon
      
      assertEq(S.polygons.length, 2, "addShape() created second polygon");
      assertEq(_undoStack.length, 2, "undo stack has 2 states");
      
      // 4. Undo
      undo();
      assertEq(S.polygons.length, 1, "undo() reverted second polygon");
      assertEq(_redoStack.length, 1, "undo() pushed to redo stack");
      
      // 5. Undo again
      undo();
      assertEq(S.polygons.length, 0, "undo() reverted first polygon");
      assertEq(_redoStack.length, 2, "redo stack has 2 states");
      
      // 6. Redo
      redo();
      assertEq(S.polygons.length, 1, "redo() restored first polygon");
      
      // 7. Mutate after undo (should clear redo stack)
      S.mouse = { wx: 300, wy: 300 };
      addShape();
      assertEq(S.polygons.length, 2, "addShape() after undo created new polygon");
      assertEq(_redoStack.length, 0, "mutation cleared redo stack");
      
      if (failed === 0) {
        console.log(`ALL TESTS PASSED (${passed}/${passed})`);
        const res = document.createElement('div');
        res.id = 'test-results';
        res.textContent = 'PASSED';
        document.body.appendChild(res);
      } else {
        console.error(`${failed} TESTS FAILED`);
        const res = document.createElement('div');
        res.id = 'test-results';
        res.textContent = 'FAILED';
        document.body.appendChild(res);
      }
    } catch(e) {
      console.error("TEST ERROR:", e);
      const res = document.createElement('div');
      res.id = 'test-results';
      res.textContent = 'ERROR: ' + e.message;
      document.body.appendChild(res);
    }
  });
}
