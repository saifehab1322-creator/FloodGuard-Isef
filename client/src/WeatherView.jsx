import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from './ctx.jsx';
import { Banner, Stat } from './ui.jsx';

export const rows = (w) => w.hourly.time.map((tm, i) => ({
  time: tm.slice(5, 16).replace('T', ' '), rain: w.hourly.precipitation[i], prob: w.hourly.probability[i],
  temp: w.hourly.temperature[i], hum: w.hourly.humidity[i], wind: w.hourly.windSpeed[i], soil: w.hourly.soil[i],
}));
const ax = { stroke: '#64748b', fontSize: 11 };

export function WeatherMeta({ w }) {
  const { t, fmt } = useApp();
  return (
    <div className="space-y-2 text-sm">
      {w.cached && <Banner kind="warn">{t('cachedBanner')} {fmt(w.fetchedAt)}</Banner>}
      <div className="text-slate-400">{t('source')}: <b className="text-slate-200">{w.source}</b> · {t('lastUpdate')}: <b className="text-slate-200">{fmt(w.fetchedAt)}</b> · {t('forecastPeriod')}: <b className="text-slate-200">{w.forecastStart?.replace('T', ' ')} → {w.forecastEnd?.replace('T', ' ')}</b></div>
    </div>
  );
}
export function WeatherStats({ w }) {
  const { t } = useApp();
  const s = w.summary;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Stat label={t('temp')} value={s.tempNow} unit="°C" /><Stat label={t('humidity')} value={s.humidityNow} unit="%" />
      <Stat label={t('rain72')} value={s.totalRainMm} unit="mm" /><Stat label={t('prob')} value={s.maxPrecipProb} unit="%" />
      <Stat label={t('wind')} value={s.windNow} unit="km/h" /><Stat label={t('windDir')} value={s.windDirNow} unit="°" />
      <Stat label={t('soil')} value={s.soilMoistureMax} unit="m³/m³" /><Stat label={t('elevation')} value={w.elevation} unit="m" />
    </div>
  );
}
export function RainChart({ w, h = 'h-56' }) {
  const d = rows(w);
  return (
    <div className={h}><ResponsiveContainer><AreaChart data={d}><CartesianGrid stroke="#1e3a52" strokeDasharray="3 3" /><XAxis dataKey="time" {...ax} interval={11} /><YAxis {...ax} /><Tooltip contentStyle={{ background: '#0f2238', border: '1px solid #22d3ee55' }} /><Area dataKey="rain" name="mm/h" stroke="#22d3ee" fill="#22d3ee55" /></AreaChart></ResponsiveContainer></div>
  );
}
export function LineBlock({ w, keys, h = 'h-48' }) {
  const d = rows(w);
  return (
    <div className={h}><ResponsiveContainer><LineChart data={d}><CartesianGrid stroke="#1e3a52" strokeDasharray="3 3" /><XAxis dataKey="time" {...ax} interval={11} /><YAxis {...ax} /><Tooltip contentStyle={{ background: '#0f2238', border: '1px solid #22d3ee55' }} />
      {keys.map(([k, c]) => <Line key={k} dataKey={k} stroke={c} dot={false} strokeWidth={2} />)}</LineChart></ResponsiveContainer></div>
  );
}
