import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRisk, validateInputs } from '../src/riskEngine.js';

const full = { rainfallIntensity: 30, totalRainfall: 100, soilMoisture: 0.45, elevation: 0, terrain: 'flat_basin' };

test('extreme inputs give 100 / high', () => {
  const r = calculateRisk(full);
  assert.equal(r.score, 100); assert.equal(r.level, 'high'); assert.equal(r.reliability, 'high');
});
test('benign inputs give low', () => {
  const r = calculateRisk({ rainfallIntensity: 0, totalRainfall: 0, soilMoisture: 0.1, elevation: 500, terrain: 'elevated_plateau' });
  assert.equal(r.level, 'low'); assert.equal(r.score, 3);
});
test('contributions sum to the score', () => {
  const r = calculateRisk({ rainfallIntensity: 12, totalRainfall: 40, soilMoisture: 0.3, elevation: 120, terrain: 'urban' });
  const sum = r.factors.reduce((s, x) => s + x.contribution, 0);
  assert.ok(Math.abs(sum - r.score) <= 0.1);
});
test('missing soil: weights renormalized, reliability still high at 0.8', () => {
  const r = calculateRisk({ ...full, soilMoisture: null });
  assert.equal(r.score, 100); assert.deepEqual(r.missing, ['soil']); assert.equal(r.coverage, 0.8);
});
test('missing soil and terrain lowers reliability to medium', () => {
  const r = calculateRisk({ ...full, soilMoisture: '', terrain: '' });
  assert.equal(r.reliability, 'medium'); assert.equal(r.coverage, 0.65);
});
test('no rainfall data -> insufficient, no score', () => {
  const r = calculateRisk({ soilMoisture: 0.4, elevation: 10, terrain: 'wadi' });
  assert.equal(r.score, null); assert.equal(r.level, 'insufficient');
});
test('total rainfall alone gives a low-reliability score', () => {
  const r = calculateRisk({ totalRainfall: 50 });
  assert.ok(r.score > 0); assert.equal(r.reliability, 'low'); assert.ok(r.missing.includes('intensity'));
});
test('duration is not scored separately (no double counting)', () => {
  const a = calculateRisk({ ...full, durationHours: 1 }), b = calculateRisk({ ...full, durationHours: 48 });
  assert.equal(a.score, b.score);
});
test('custom thresholds and weights', () => {
  const r = calculateRisk({ rainfallIntensity: 15, totalRainfall: 50, soilMoisture: 0.275, elevation: 250, terrain: 'desert_plain' }, { thresholds: { moderate: 10, high: 20 } });
  assert.equal(r.level, 'high');
  const r2 = calculateRisk(full, { weights: { rainfall: 1, soil: 0, elevation: 0, terrain: 0 } });
  assert.equal(r2.score, 100);
});
test('validation rejects bad values', () => {
  assert.ok(validateInputs({ totalRainfall: -1 }).length);
  assert.ok(validateInputs({ soilMoisture: 2 }).length);
  assert.ok(validateInputs({ terrain: 'moon' }).length);
  assert.ok(validateInputs({ elevation: 'abc' }).length);
  assert.equal(validateInputs(full).length, 0);
});
