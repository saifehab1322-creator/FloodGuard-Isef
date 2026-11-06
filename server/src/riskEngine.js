// Explainable flood risk INDEX (0-100). NOT a validated flood probability.
export const DEFAULT_WEIGHTS = { rainfall: 0.5, soil: 0.2, elevation: 0.15, terrain: 0.15 };
// Intensity, total rainfall and duration are strongly correlated. Intensity+total are merged into ONE
// "rainfall" factor; duration is informational only and is never added as a separate score.
export const RAIN_SUBWEIGHTS = { intensity: 0.4, total: 0.6 };
export const DEFAULT_THRESHOLDS = { moderate: 33, high: 66 };
// Normalization ranges are configurable modelling ASSUMPTIONS, not measured constants.
export const RANGES = { intensity: [0, 30], total: [0, 100], soil: [0.1, 0.45], elevation: [0, 500] };
export const TERRAIN = { flat_basin: 1, wadi: 0.9, urban: 0.8, coastal_plain: 0.6, mountain_slope: 0.5, desert_plain: 0.4, elevated_plateau: 0.2 };

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const norm = (v, [a, b]) => clamp01((v - a) / (b - a));
export const toNum = (v) => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

export function validateInputs(i = {}) {
  const e = [];
  const chk = (k, lo, hi) => {
    const raw = i[k];
    if (raw === null || raw === undefined || raw === '') return;
    const v = toNum(raw);
    if (v === null) e.push(`${k} must be numeric`);
    else if (v < lo || v > hi) e.push(`${k} must be between ${lo} and ${hi}`);
  };
  chk('rainfallIntensity', 0, 500); chk('totalRainfall', 0, 2000); chk('durationHours', 0, 720);
  chk('soilMoisture', 0, 1); chk('elevation', -450, 3100);
  if (i.terrain && !Object.hasOwn(TERRAIN, i.terrain)) e.push('terrain is not a valid class');
  return e;
}

export function calculateRisk(inputs = {}, { weights = {}, thresholds = {} } = {}) {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  const th = { ...DEFAULT_THRESHOLDS, ...thresholds };
  const inten = toNum(inputs.rainfallIntensity), tot = toNum(inputs.totalRainfall), dur = toNum(inputs.durationHours);
  const soil = toNum(inputs.soilMoisture), elev = toNum(inputs.elevation);
  const terrain = inputs.terrain && Object.hasOwn(TERRAIN, inputs.terrain) ? inputs.terrain : null;

  const parts = [];
  if (inten !== null) parts.push([RAIN_SUBWEIGHTS.intensity, norm(inten, RANGES.intensity)]);
  if (tot !== null) parts.push([RAIN_SUBWEIGHTS.total, norm(tot, RANGES.total)]);
  const rw = parts.reduce((s, p) => s + p[0], 0);
  const rainScore = rw ? parts.reduce((s, p) => s + p[0] * p[1], 0) / rw : null;

  const f = [
    { key: 'rainfall', raw: { intensity: inten, total: tot, duration: dur }, normalized: rainScore, cov: rw },
    { key: 'soil', raw: soil, normalized: soil === null ? null : norm(soil, RANGES.soil), cov: soil === null ? 0 : 1 },
    { key: 'elevation', raw: elev, normalized: elev === null ? null : 1 - norm(elev, RANGES.elevation), cov: elev === null ? 0 : 1 },
    { key: 'terrain', raw: terrain, normalized: terrain ? TERRAIN[terrain] : null, cov: terrain ? 1 : 0 },
  ];
  const totalW = f.reduce((s, x) => s + w[x.key], 0) || 1;
  const availW = f.reduce((s, x) => s + w[x.key] * x.cov, 0);
  const coverage = Math.round((availW / totalW) * 100) / 100;

  // Missing variables: remaining weights are renormalized and reliability is lowered.
  f.forEach((x) => {
    x.configuredWeight = w[x.key] / totalW;
    x.effectiveWeight = availW > 0 ? (w[x.key] * x.cov) / availW : 0;
    x.contribution = x.normalized === null ? 0 : Math.round(100 * x.effectiveWeight * x.normalized * 100) / 100;
    x.available = x.cov > 0;
  });
  const missing = [];
  if (inten === null) missing.push('intensity');
  if (tot === null) missing.push('total');
  if (soil === null) missing.push('soil');
  if (elev === null) missing.push('elevation');
  if (!terrain) missing.push('terrain');

  const base = { coverage, factors: f, missing, thresholds: th, weights: w };
  if (rw === 0) return { ...base, score: null, level: 'insufficient', reliability: 'low' };

  const score = Math.round(f.reduce((s, x) => s + x.contribution, 0) * 10) / 10;
  const level = score >= th.high ? 'high' : score >= th.moderate ? 'moderate' : 'low';
  const reliability = coverage >= 0.8 ? 'high' : coverage >= 0.5 ? 'medium' : 'low';
  return { ...base, score, level, reliability };
}
