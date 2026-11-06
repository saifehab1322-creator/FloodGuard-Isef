import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
import LocationPicker from '../LocationPicker.jsx';
import { Banner, Spin } from '../ui.jsx';
import { LineBlock, RainChart, WeatherMeta, WeatherStats } from '../WeatherView.jsx';

export default function Weather() {
  const { t, demo } = useApp();
  const [loc, setLoc] = useState(null);
  const [st, setSt] = useState({ w: null, err: null, loading: false });
  useEffect(() => {
    if (!loc || demo) return;
    setSt({ w: null, err: null, loading: true });
    api('/weather/' + loc.id).then((w) => setSt({ w, err: null, loading: false })).catch((e) => setSt({ w: null, err: e.message, loading: false }));
  }, [loc, demo]);
  const { w, err, loading } = st;
  return (
    <div className="space-y-4">
      <h1>{t('nav_weather')}</h1>
      <div className="card"><LocationPicker value={loc} onChange={setLoc} /></div>
      {demo && <Banner kind="warn">{t('demoBanner')}</Banner>}
      {loading && <Spin />}
      {err && <Banner kind="err">{err}</Banner>}
      {w && !demo && (<>
        <div className="card space-y-3"><WeatherMeta w={w} /><WeatherStats w={w} /></div>
        <div className="card"><h2>{t('rainChart')} (mm/h)</h2><RainChart w={w} /></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card"><h2>{t('temp')} °C / {t('humidity')} %</h2><LineBlock w={w} keys={[['temp', '#fbbf24'], ['hum', '#2dd4bf']]} /></div>
          <div className="card"><h2>{t('wind')} km/h · {t('prob')} %</h2><LineBlock w={w} keys={[['wind', '#22d3ee'], ['prob', '#a78bfa']]} /></div>
        </div>
      </>)}
    </div>
  );
}
