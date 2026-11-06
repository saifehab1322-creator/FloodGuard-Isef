import { Router } from 'express';
import { pool } from './db.js';
import { calculateRisk, validateInputs, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, TERRAIN } from './riskEngine.js';
import { fetchForecast } from './weather.js';
import { buildAlert } from './alerts.js';
import { scenarios } from './demo.js';

const r = Router();
const httpErr = (status, message) => Object.assign(new Error(message), { status });
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e.message);
  res.status(e.status || 500).json({ error: e.status ? e.message : 'Server/database error: ' + e.message });
});
const demoFlag = (q) => (q.demo === '1' ? 1 : 0);

async function getThresholds() {
  const [rows] = await pool.query('SELECT skey, svalue FROM settings');
  const s = { ...DEFAULT_THRESHOLDS };
  rows.forEach((x) => { if (x.skey in s) s[x.skey] = Number(x.svalue); });
  return s;
}

r.get('/health', wrap(async (req, res) => { await pool.query('SELECT 1'); res.json({ ok: true, db: 'connected', time: new Date().toISOString() }); }));
r.get('/config', (req, res) => res.json({ terrain: Object.keys(TERRAIN), weights: DEFAULT_WEIGHTS }));
r.get('/demo/scenarios', (req, res) => res.json(scenarios));

// ---- Locations
r.get('/locations', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM locations ORDER BY is_governorate DESC, name_en');
  res.json(rows);
}));
r.get('/geocode', wrap(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) throw httpErr(400, 'Query must be at least 2 characters');
  try {
    const u = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&countryCode=EG`;
    const j = await (await fetch(u, { signal: AbortSignal.timeout(8000) })).json();
    res.json((j.results || []).map((x) => ({ name: x.name, admin1: x.admin1 || null, latitude: x.latitude, longitude: x.longitude })));
  } catch (e) { throw httpErr(502, 'Geocoding API unavailable: ' + e.message); }
}));
r.post('/locations', wrap(async (req, res) => {
  const { name_en, name_ar = null, latitude, longitude } = req.body || {};
  const lat = Number(latitude), lon = Number(longitude);
  if (!name_en || typeof name_en !== 'string' || name_en.length > 120) throw httpErr(400, 'name_en is required');
  if (!(lat >= 21.5 && lat <= 32 && lon >= 24.5 && lon <= 37)) throw httpErr(400, 'Coordinates must be inside Egypt');
  await pool.query('INSERT IGNORE INTO locations (name_en,name_ar,latitude,longitude) VALUES (?,?,?,?)', [name_en, name_ar, lat, lon]);
  const [[row]] = await pool.query('SELECT * FROM locations WHERE name_en=? AND latitude=? AND longitude=?', [name_en, lat, lon]);
  res.status(201).json(row);
}));

// ---- Weather (live from Open-Meteo, cached in MySQL; falls back to latest cached record)
r.get('/weather/:id', wrap(async (req, res) => {
  const [[loc]] = await pool.query('SELECT * FROM locations WHERE id=?', [req.params.id]);
  if (!loc) throw httpErr(404, 'Location not found');
  try {
    const w = await fetchForecast(loc.latitude, loc.longitude);
    const s = w.summary;
    await pool.query(
      'INSERT INTO weather_records (location_id,fetched_at,forecast_hours,elevation_m,total_rain_mm,max_intensity_mm_h,rain_hours,max_precip_prob,soil_moisture_max,source,payload) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [loc.id, new Date(w.fetchedAt), w.hours, w.elevation, s.totalRainMm, s.maxIntensityMmH, s.rainHours, s.maxPrecipProb, s.soilMoistureMax, w.source, JSON.stringify(w)],
    );
    res.json({ ...w, location: loc, cached: false });
  } catch (err) {
    const [[c]] = await pool.query('SELECT payload FROM weather_records WHERE location_id=? ORDER BY id DESC LIMIT 1', [loc.id]);
    if (c) return res.json({ ...c.payload, location: loc, cached: true, liveError: err.message });
    res.status(502).json({ error: 'Weather API unavailable and no cached data for this location. Switch to Demo Mode for labeled sample scenarios.', detail: err.message });
  }
}));

// ---- Risk
r.post('/risk/calculate', wrap(async (req, res) => {
  const { inputs = {}, weights } = req.body || {};
  const e = validateInputs(inputs);
  if (e.length) throw httpErr(400, e.join('; '));
  res.json(calculateRisk(inputs, { weights, thresholds: await getThresholds() }));
}));
r.post('/assessments', wrap(async (req, res) => {
  const { locationId, inputs = {}, weights, inputSource = 'manual', label = null, isDemo = false } = req.body || {};
  const e = validateInputs(inputs);
  if (e.length) throw httpErr(400, e.join('; '));
  if (!['api', 'manual', 'mixed', 'demo'].includes(inputSource)) throw httpErr(400, 'Invalid inputSource');
  const [[loc]] = await pool.query('SELECT * FROM locations WHERE id=?', [locationId]);
  if (!loc) throw httpErr(404, 'Location not found');
  const demo = isDemo ? 1 : 0;
  const result = calculateRisk(inputs, { weights, thresholds: await getThresholds() });
  const [ins] = await pool.query(
    'INSERT INTO risk_assessments (location_id,score,level,reliability,input_source,is_demo,label,inputs,breakdown) VALUES (?,?,?,?,?,?,?,?,?)',
    [loc.id, result.score, result.level, result.reliability, demo ? 'demo' : inputSource, demo, label ? String(label).slice(0, 120) : null, JSON.stringify(inputs), JSON.stringify(result)],
  );
  const a = buildAlert(result.level, result.score, loc);
  let alertId = null;
  if (a) {
    const [ai] = await pool.query(
      'INSERT INTO alerts (location_id,assessment_id,severity,message_en,message_ar,recommendations,is_demo) VALUES (?,?,?,?,?,?,?)',
      [loc.id, ins.insertId, a.severity, a.message_en, a.message_ar, JSON.stringify(a.recommendations), demo],
    );
    alertId = ai.insertId;
  }
  res.status(201).json({ id: ins.insertId, alertId, result });
}));
const ASM = `SELECT a.*, l.name_en, l.name_ar, l.latitude, l.longitude FROM risk_assessments a JOIN locations l ON l.id=a.location_id`;
r.get('/assessments', wrap(async (req, res) => {
  const [rows] = await pool.query(`${ASM} WHERE a.is_demo=? ORDER BY a.id DESC LIMIT 200`, [demoFlag(req.query)]);
  res.json(rows);
}));
r.get('/assessments/latest', wrap(async (req, res) => {
  const [rows] = await pool.query(`${ASM} WHERE a.is_demo=? AND a.id=(SELECT MAX(b.id) FROM risk_assessments b WHERE b.location_id=a.location_id AND b.is_demo=a.is_demo)`, [demoFlag(req.query)]);
  res.json(rows);
}));

// ---- Alerts & settings
r.get('/alerts', wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT al.*, l.name_en, l.name_ar FROM alerts al JOIN locations l ON l.id=al.location_id WHERE al.is_demo=? ORDER BY al.id DESC LIMIT 200', [demoFlag(req.query)]);
  res.json(rows);
}));
r.get('/settings', wrap(async (req, res) => res.json(await getThresholds())));
r.put('/settings', wrap(async (req, res) => {
  const m = Number(req.body?.moderate), h = Number(req.body?.high);
  if (!(m > 0 && m < h && h <= 100)) throw httpErr(400, 'Require 0 < moderate < high <= 100');
  await pool.query("INSERT INTO settings (skey,svalue) VALUES ('moderate',?),('high',?) ON DUPLICATE KEY UPDATE svalue=VALUES(svalue)", [String(m), String(h)]);
  res.json({ moderate: m, high: h });
}));

// ---- Dashboard
r.get('/dashboard', wrap(async (req, res) => {
  const d = demoFlag(req.query);
  const [[latest]] = await pool.query(`${ASM} WHERE a.is_demo=? ORDER BY a.id DESC LIMIT 1`, [d]);
  const [dist] = await pool.query(`SELECT a.level, COUNT(*) AS n FROM risk_assessments a WHERE a.is_demo=? AND a.id=(SELECT MAX(b.id) FROM risk_assessments b WHERE b.location_id=a.location_id AND b.is_demo=a.is_demo) GROUP BY a.level`, [d]);
  const [alerts] = await pool.query('SELECT al.*, l.name_en, l.name_ar FROM alerts al JOIN locations l ON l.id=al.location_id WHERE al.is_demo=? ORDER BY al.id DESC LIMIT 5', [d]);
  const [recent] = await pool.query(`${ASM} WHERE a.is_demo=? ORDER BY a.id DESC LIMIT 6`, [d]);
  let weather = null;
  if (!d) { // weather records are real observations/forecasts only; never shown in demo mode
    const [[w]] = await pool.query('SELECT w.payload, l.name_en, l.name_ar FROM weather_records w JOIN locations l ON l.id=w.location_id ORDER BY w.id DESC LIMIT 1');
    if (w) weather = { ...w.payload, location: { name_en: w.name_en, name_ar: w.name_ar } };
  }
  res.json({ latest: latest || null, distribution: dist, alerts, recent, weather });
}));

export default r;
