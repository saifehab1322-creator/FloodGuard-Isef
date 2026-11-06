// Open-Meteo forecast client. Only real API data is returned; nothing is simulated here.
const BASE = 'https://api.open-meteo.com/v1/forecast';
const HOURLY = 'temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,wind_speed_10m,wind_direction_10m,soil_moisture_0_to_1cm';
const nums = (a) => (a || []).filter((x) => typeof x === 'number');
const sum = (a) => nums(a).reduce((s, x) => s + x, 0);
const max = (a) => (nums(a).length ? Math.max(...nums(a)) : null);
const r2 = (x) => (x === null ? null : Math.round(x * 100) / 100);

export async function fetchForecast(lat, lon) {
  const p = new URLSearchParams({ latitude: lat, longitude: lon, hourly: HOURLY, forecast_days: '3', timezone: 'Africa/Cairo' });
  const res = await fetch(`${BASE}?${p}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const j = await res.json();
  const h = j.hourly;
  if (!h || !h.time) throw new Error('Unexpected Open-Meteo response');
  const nowLocal = new Date(Date.now() + (j.utc_offset_seconds || 0) * 1000).toISOString().slice(0, 13) + ':00';
  const idx = Math.max(0, h.time.findIndex((t) => t >= nowLocal));
  const summary = {
    totalRainMm: r2(sum(h.precipitation)),
    maxIntensityMmH: r2(max(h.precipitation)),
    rainHours: nums(h.precipitation).filter((x) => x >= 0.1).length,
    maxPrecipProb: max(h.precipitation_probability),
    soilMoistureMax: r2(max(h.soil_moisture_0_to_1cm)),
    tempNow: h.temperature_2m?.[idx] ?? null,
    humidityNow: h.relative_humidity_2m?.[idx] ?? null,
    windNow: h.wind_speed_10m?.[idx] ?? null,
    windDirNow: h.wind_direction_10m?.[idx] ?? null,
  };
  return {
    source: 'Open-Meteo Forecast API (open-meteo.com)',
    fetchedAt: new Date().toISOString(),
    forecastStart: h.time[0], forecastEnd: h.time[h.time.length - 1], hours: h.time.length,
    timezone: j.timezone, elevation: j.elevation ?? null,
    units: j.hourly_units,
    summary,
    // Values pre-filled into the risk analysis form (all derived from the real forecast above).
    assessmentInputs: {
      rainfallIntensity: summary.maxIntensityMmH, totalRainfall: summary.totalRainMm, durationHours: summary.rainHours,
      soilMoisture: summary.soilMoistureMax, elevation: j.elevation ?? null,
    },
    hourly: {
      time: h.time, temperature: h.temperature_2m, humidity: h.relative_humidity_2m, precipitation: h.precipitation,
      probability: h.precipitation_probability, windSpeed: h.wind_speed_10m, windDir: h.wind_direction_10m, soil: h.soil_moisture_0_to_1cm,
    },
  };
}
