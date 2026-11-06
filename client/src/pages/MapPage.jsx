import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
import { Badge, Banner, LEVEL_COLOR, Spin, useFetch } from '../ui.jsx';
import { WeatherMeta, WeatherStats } from '../WeatherView.jsx';

export default function MapPage() {
  const { t, name, demo, lang, fmt } = useApp();
  const { data: locs } = useFetch('/locations');
  const { data: asm } = useFetch('/assessments/latest?demo=' + (demo ? 1 : 0), 20000);
  const el = useRef(), map = useRef(), layer = useRef();
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState('');
  const [wx, setWx] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    map.current = L.map(el.current).setView([27, 30.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 18 }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    if (!locs) return;
    layer.current.clearLayers();
    locs.forEach((l) => {
      const a = asm?.find((x) => x.location_id === l.id);
      const c = LEVEL_COLOR[a ? a.level : 'insufficient'];
      L.circleMarker([Number(l.latitude), Number(l.longitude)], { radius: a ? 11 : 7, color: c, fillColor: c, fillOpacity: 0.6 })
        .on('click', () => pick(l)).bindTooltip(name(l)).addTo(layer.current);
    });
  }, [locs, asm, lang]);

  const pick = (l) => { setSel(l); setWx(null); setErr(null); };
  const fly = (l) => { pick(l); map.current.flyTo([Number(l.latitude), Number(l.longitude)], 8); };
  const loadWx = async () => { setBusy(true); setErr(null); try { setWx(await api('/weather/' + sel.id)); } catch (e) { setErr(e.message); } setBusy(false); };
  const a = sel && asm?.find((x) => x.location_id === sel.id);
  const hits = q ? (locs || []).filter((l) => (l.name_en + (l.name_ar || '')).toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];

  return (
    <div className="space-y-4">
      <h1>{t('nav_map')}</h1>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-2 space-y-2">
          <div ref={el} className="h-[55vh] rounded-xl z-0" />
          <div className="flex flex-wrap gap-3 text-xs px-2">{['low', 'moderate', 'high', 'insufficient'].map((k) => <span key={k} className="flex items-center gap-1"><i className="w-3 h-3 rounded-full inline-block" style={{ background: LEVEL_COLOR[k] }} />{k === 'insufficient' ? t('mapNotAssessed') : t('lvl_' + k)}</span>)}<span className="text-slate-500">{t('tilesNote')}</span></div>
        </div>
        <div className="card space-y-3">
          <input className="inp" placeholder={t('searchPlace')} value={q} onChange={(e) => setQ(e.target.value)} />
          {hits.map((l) => <button key={l.id} className="btn2 block w-full text-start" onClick={() => { fly(l); setQ(''); }}>{name(l)}</button>)}
          {sel && (<div className="space-y-2">
            <h2>{name(sel)}</h2>
            <div className="text-xs text-slate-400">{t('coords')}: {Number(sel.latitude).toFixed(3)}, {Number(sel.longitude).toFixed(3)}</div>
            {a ? <div className="space-y-1"><div className="flex items-center gap-2"><Badge level={a.level} /><b className="text-cyan-300">{a.score ?? '—'}</b></div><div className="text-xs text-slate-400">{t('reliability')}: {t('rel_' + a.reliability)} · {fmt(a.created_at)}</div></div> : <Banner kind="warn">{t('mapNotAssessed')}</Banner>}
            {!demo && <button className="btn2" onClick={loadWx} disabled={busy}>☁ {t('fetchWeather')}</button>}
            {busy && <Spin />}{err && <Banner kind="err">{err}</Banner>}
            {wx && <div className="space-y-2"><WeatherMeta w={wx} /><WeatherStats w={wx} /></div>}
          </div>)}
        </div>
      </div>
    </div>
  );
}
