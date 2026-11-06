import { useEffect, useState } from 'react';
import { api } from './api.js';
import { useApp } from './ctx.jsx';
import { Banner, useFetch } from './ui.jsx';

export default function LocationPicker({ value, onChange }) {
  const { t, name } = useApp();
  const { data: locs, reload } = useFetch('/locations');
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => { if (locs && !value && locs.length) onChange(locs[0]); }, [locs]);
  const search = async () => { setErr(''); try { setRes(await api('/geocode?q=' + encodeURIComponent(q))); } catch (e) { setErr(e.message); } };
  const add = async (g) => {
    const l = await api('/locations', { method: 'POST', body: { name_en: g.name + (g.admin1 ? `, ${g.admin1}` : ''), latitude: g.latitude, longitude: g.longitude } });
    await reload(); onChange(l); setRes([]); setQ('');
  };
  return (
    <div className="space-y-2">
      <label className="lbl">{t('location')}</label>
      <select className="inp" value={value?.id || ''} onChange={(e) => onChange(locs.find((l) => l.id == e.target.value))}>
        {(locs || []).map((l) => <option key={l.id} value={l.id}>{name(l)}</option>)}
      </select>
      <div className="flex gap-2">
        <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlace')} onKeyDown={(e) => e.key === 'Enter' && search()} />
        <button className="btn2" onClick={search}>{t('search')}</button>
      </div>
      {err && <Banner kind="err">{err}</Banner>}
      {res.map((g, i) => <button key={i} className="block w-full text-start btn2" onClick={() => add(g)}>{g.name}{g.admin1 ? `, ${g.admin1}` : ''} <span className="text-slate-500 text-xs">({g.latitude.toFixed(2)}, {g.longitude.toFixed(2)})</span></button>)}
    </div>
  );
}
