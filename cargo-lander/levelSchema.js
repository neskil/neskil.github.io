// levelSchema.js — shared schema for the scalar/object-shaped fields of a
// `registerLevel({...})` level config (level1.js..level9.js, levelTest.js).
//
// Read by BOTH:
//   - level-editor.html — drives the Metadata / Palette / Out of Bounds /
//     Gravity Well sidebar form panels, the loader's per-field defaults, and
//     the export-block generator.
//   - tests.html — drives the scalar-field checks in the "Level Config
//     Validation" test category.
// so a new scalar field only needs to be added HERE instead of being kept in
// sync by hand across the editor's parser, its UI, its exporter, AND the test
// suite's hand-written assertions. See the "Level Editor / renderer parity
// system" TODO entry in README.md for the problem this solves.
//
// Scope: mission-parameter scalars, `palette`, `outOfBounds`, and
// `gravityWell`. Geometry arrays (`terrainPolygons`/`waterBodies`/`hazards`)
// are NOT covered — the editor's vertex-drag tooling for those is bespoke per
// shape kind (zone/laser/crusher/etc.), not purely data-driven, and stays
// hand-coded; see README for why that's deferred.
//
// Field descriptor shape:
//   key       — property name on the config object (or sub-object)
//   type      — 'string' | 'number' | 'integer' | 'boolean' | 'stringList' |
//               'color' | 'rgba' | 'rgbaPrefix'  ('color'/'rgba'/'rgbaPrefix'
//               are all string-typed at the JS level; they only differ in
//               which editor widget/validation makes sense)
//   default   — value substituted when the field is absent from a loaded config
//   widget    — editor UI hint: 'text' | 'number' | 'checkbox' | 'color' | 'select'
//   label     — short sidebar label
//   required  — tests.html asserts the field is present (and non-empty for
//               strings/lists, positive where `positive` is also set)
//   positive  — numeric fields only: must be > 0 when present
//   min       — integer fields only: minimum allowed value
//   options   — 'select' widgets / enum-checked strings: allowed values
//   enumValues— for 'stringList': every item must be one of these
//   nullable  — field may explicitly be absent/null with no computed
//               fallback (e.g. Y-position overrides that default to "read
//               off the terrain surface" rather than a fixed number)
//   validate  — optional custom `(value) => boolean` check (e.g. rockGlow's
//               partial-rgba-string convention)

const VALID_CARGO_TYPES   = ['normal', 'red', 'blue', 'green', 'tethered', 'heavy'];
const VALID_WEATHER_TYPES = ['', 'rain', 'ash', 'snow', 'heatwave', 'bubbles'];
const VALID_OOB_TYPES     = ['water', 'goo', 'sand', 'acid', 'void'];

const LEVEL_SCHEMA = {
  // Top-level scalar/list fields on the registerLevel({...}) config object.
  fields: [
    { key:'name',            type:'string',    default:'',  widget:'text',     label:'ID (name)', required:true },
    { key:'missionTitle',    type:'string',    default:'',  widget:'text',     label:'Title' },
    { key:'description',     type:'string',    default:'',  widget:'text',     label:'Desc' },
    { key:'hint',            type:'string',    default:'',  widget:'text',     label:'Hint' },
    { key:'gravity',         type:'number',    default:0.11,widget:'number',   label:'Gravity', step:0.01, required:true, positive:true },
    { key:'wind',            type:'number',    default:0,   widget:'number',   label:'Wind', step:0.01 },
    { key:'weather',         type:'string',    default:'',  widget:'select',   label:'Weather', options:VALID_WEATHER_TYPES },
    { key:'budget',          type:'number',    default:1000,widget:'number',   label:'Budget', required:true, positive:true },
    { key:'timeLimit',       type:'number',    default:300, widget:'number',   label:'Time', required:true, positive:true },
    { key:'padScale',        type:'number',    default:1,   widget:'number',   label:'PadScale', step:0.1, positive:true },
    { key:'targetCargo',     type:'integer',   default:3,   widget:'number',   label:'Target', required:true, min:1 },
    { key:'allowedTypes',    type:'stringList',default:['normal','red','blue','green'], widget:'text', label:'Types', required:true, enumValues:VALID_CARGO_TYPES },
    { key:'heavyCargo',      type:'boolean',   default:false, widget:'checkbox', label:'Heavy' },
    { key:'heatHaze',        type:'boolean',   default:false, widget:'checkbox', label:'Heat Haze' },
    { key:'startX',          type:'number',    default:80,  widget:'number',   label:'X' },
    { key:'startY',          type:'number',    default:null, nullable:true, widget:'number', label:'Y' },
    { key:'startDepotWidth', type:'number',    default:null, nullable:true, widget:'number', label:'Width' },
    { key:'collectionX',     type:'number',    default:null, nullable:true, widget:'number', label:'X' },
    { key:'collectionY',     type:'number',    default:null, nullable:true, widget:'number', label:'Y' },
    { key:'collectionWidth', type:'number',    default:null, nullable:true, widget:'number', label:'Width' },
  ],

  // palette: {...} — required object on every level; the same 7 keys are
  // used everywhere (confirmed by grepping all 9 levels + levelTest), each
  // required and non-empty.
  palette: {
    fields: [
      { key:'skyTop',      type:'color',      default:'#020617', widget:'color', label:'skyTop', required:true },
      { key:'skyMid',      type:'color',      default:'#040b16', widget:'color', label:'skyMid', required:true },
      { key:'skyBot',      type:'color',      default:'#051114', widget:'color', label:'skyBot', required:true },
      { key:'terrainFill', type:'color',      default:'#06101c', widget:'color', label:'terrainFill', required:true },
      { key:'rockEdge',    type:'color',      default:'#38bdf8', widget:'color', label:'rockEdge', required:true },
      // Intentionally a PARTIAL rgba string (no closing paren/alpha) — render
      // call sites append the alpha themselves, e.g. `${pal.rockGlow}0.1)`.
      { key:'rockGlow',    type:'rgbaPrefix', default:'rgba(56,189,248,', widget:'text', label:'rockGlow', required:true,
        validate: v => v.startsWith('rgba(') && v.endsWith(',') },
      { key:'fog',         type:'rgba',       default:'rgba(56,189,248,0.1)', widget:'text', label:'fog', required:true },
    ]
  },

  // outOfBounds: {...} — optional object on most levels. L9 uses the bare
  // boolean `true` instead ("thick lateral fog on the sides", no zone
  // mechanics) — callers must special-case that shorthand before reading
  // these sub-fields; see levelSchemaIsOOBObject() below.
  outOfBounds: {
    fields: [
      { key:'type',         type:'string', default:'water', widget:'select', label:'Type', options:VALID_OOB_TYPES },
      { key:'color',        type:'color',  default:'',    widget:'color',  label:'Color' },
      { key:'mistColor',    type:'color',  default:'',    widget:'color',  label:'Mist Color' },
      { key:'surfaceY',     type:'number', default:600,   widget:'number', label:'Surface Y' },
      { key:'monsterDepth', type:'number', default:900,   widget:'number', label:'Monster Y' },
      { key:'drag',         type:'number', default:0.02,  widget:'number', label:'Drag', step:0.01 },
      { key:'buoyancy',     type:'number', default:0.05,  widget:'number', label:'Buoyancy', step:0.01 },
    ]
  },

  // gravityWell: {...} — optional object (L4, L8, levelTest). L9 has a
  // conceptually similar well but expresses it as a `hazards[].type ===
  // 'blackhole'` entry instead — that's geometry-adjacent hazard data, out of
  // this schema's scope, and untouched by this pass.
  gravityWell: {
    fields: [
      { key:'x',           type:'number', default:500, widget:'number', label:'X' },
      { key:'y',           type:'number', default:500, widget:'number', label:'Y' },
      { key:'radius',      type:'number', default:300, widget:'number', label:'Radius' },
      { key:'strength',    type:'number', default:1,   widget:'number', label:'Strength', step:0.1 },
      { key:'orbitRadius', type:'number', default:0,   widget:'number', label:'Orbit' },
    ]
  },

  // quests: [...] — a list built from questPrimary()/questNoCrash()/etc.
  // helper calls (levels.js), not a flat scalar/object shape, so it isn't
  // form-generated from this schema like the sections above (the editor's
  // existing fixed Quests panel — primary/no-crash/no-cargo/quick/worm —
  // already covers the full set of kinds in use). Listed here so tests.html
  // has one shared place to check known quest `id`/`type` pairs instead of a
  // second hand-maintained list.
  questKinds: {
    primary:       { type:'primary' },
    no_crash:      { type:'bonus' },
    no_cargo_lost: { type:'bonus' },
    quick:         { type:'bonus' },
    survive_worm:  { type:'bonus' },
  },

  VALID_CARGO_TYPES,
  VALID_WEATHER_TYPES,
  VALID_OOB_TYPES,
};

// Coerces a raw value (often a string from an <input>) to a field's declared
// type. Shared by the editor's onchange handlers so parsing rules live in one
// place instead of being re-implemented per input.
function levelSchemaCoerce(field, raw) {
  if (raw === '' || raw == null) return field.nullable ? null : field.default;
  switch (field.type) {
    case 'number':  { const n = +raw; return isFinite(n) ? n : field.default; }
    case 'integer': { const n = parseInt(raw, 10); return isFinite(n) ? n : field.default; }
    case 'boolean': return !!raw;
    case 'stringList': return typeof raw === 'string' ? raw.split(',').map(s => s.trim()).filter(Boolean) : raw;
    default: return raw;
  }
}

// Reads a field's value off a config object (or sub-object), applying the
// schema default when absent.
function levelSchemaGet(obj, field) {
  const v = obj ? obj[field.key] : undefined;
  return (v === undefined) ? field.default : v;
}

// True when a level's `outOfBounds` value is the full zone-config object form
// rather than L9's bare-boolean shorthand (or absent entirely).
function levelSchemaIsOOBObject(oob) {
  return !!oob && typeof oob === 'object';
}
