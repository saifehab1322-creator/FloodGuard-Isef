import { Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../ctx.jsx';
import { Badge, Banner, DemoTag, LEVEL_COLOR, Spin, useFetch } from '../ui.jsx';
import { RainChart, WeatherMeta, WeatherStats } from '../WeatherView.jsx';

export default function Dashboard() {
  const { t, lang, name, fmt, demo } = useApp();
  const { data: d, error, loading } = useFetch('/dashboard?demo=' + (demo ? 1 : 0), 30000);
  if (loading && !d) return <Spin />;
  if (error && !d) return <Banner kind="err">{error}</Banner>;
  if (!d) return null;
  const dist = ['low', 'moderate', 'high', 'insufficient'].map((k) => ({ k, label: t('lvl_' + k), n: d.distribution.find((x) => x.level === k)?.n || 0 }));
  return (
    <div className="space-y-4">
      <h1>{t('nav_dashboard')}</h1>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card space-y-2"><h2>{t('latestWeather')}</h2>
          {d.weather ? (<><div className="font-semibold">{name(d.weather.location)}</div><WeatherMeta w={{ ...d.weather, cached: false }} /><WeatherStats w={d.weather} /></>) : <p className="text-slate-500 text-sm">{demo ? t('demoBanner') : t('noData')}</p>}
        </div>
        <div className="card space-y-2"><h2>{t('latestAssessment')}</h2>
          {d.latest ? (<div className="space-y-1"><div className="flex items-center gap-3"><span className="text-4xl font-bold text-cyan-300">{d.latest.score ?? '—'}</span><Badge level={d.latest.level} />{d.latest.is_demo ? <DemoTag /> : null}</div><div className="text-sm">{name(d.latest)}</div><div className="text-xs text-slate-400">{fmt(d.latest.created_at)} · {t('reliability')}: {t('rel_' + d.latest.reliability)}</div></div>) : <p className="text-slate-500 text-sm">{t('noData')}</p>}
          <p className="text-xs text-slate-500">{t('disclaimer')}</p>
        </div>
        <div className="card"><h2>{t('distribution')}</h2>
          <div className="h-56"><ResponsiveContainer><BarChart data={dist}><CartesianGrid stroke="#1e3a52" strokeDasharray="3 3" /><XAxis dataKey="label" stroke="#64748b" fontSize={11} /><YAxis allowDecimals={false} stroke="#64748b" fontSize={11} /><Tooltip contentStyle={{ background: '#0f2238' }} /><Bar dataKey="n">{dist.map((x) => <Cell key={x.k} fill={LEVEL_COLOR[x.k]} />)}</Bar></BarChart></ResponsiveContainer></div>
        </div>
        <div className="card"><h2>{t('rainChart')}</h2>{d.weather ? <RainChart w={d.weather} /> : <p className="text-slate-500 text-sm">{t('noData')}</p>}</div>
        <div className="card space-y-2"><h2>{t('recentAlerts')}</h2>
          {d.alerts.length === 0 && <p className="text-slate-500 text-sm">{t('noData')}</p>}
          {d.alerts.map((a) => <div key={a.id} className="text-sm flex gap-2 items-start"><Badge level={a.severity} /><span>{lang === 'ar' ? a.message_ar : a.message_en}</span></div>)}
        </div>
        <div className="card space-y-2"><h2>{t('recentAssessments')}</h2>
          {d.recent.length === 0 && <p className="text-slate-500 text-sm">{t('noData')}</p>}
          {d.recent.map((a) => <div key={a.id} className="text-sm flex gap-2 items-center"><b className="text-cyan-300 w-10">{a.score ?? '—'}</b><Badge level={a.level} /><span className="truncate">{name(a)}</span><span className="text-xs text-slate-500 ms-auto">{fmt(a.created_at)}</span></div>)}
        </div>
      </div>
    </div>
  );
}
