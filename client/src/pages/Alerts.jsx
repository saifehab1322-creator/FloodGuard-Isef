import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
import { Badge, Banner, DemoTag, Spin, useFetch } from '../ui.jsx';

export default function Alerts() {
  const { t, lang, name, fmt, demo } = useApp();
  const { data, error, loading } = useFetch('/alerts?demo=' + (demo ? 1 : 0), 20000);
  const { data: s } = useFetch('/settings');
  const [th, setTh] = useState({ moderate: 33, high: 66 });
  const [msg, setMsg] = useState(null);
  useEffect(() => { if (s) setTh(s); }, [s]);
  const save = async () => { try { await api('/settings', { method: 'PUT', body: th }); setMsg({ kind: 'info', text: t('saved') }); } catch (e) { setMsg({ kind: 'err', text: e.message }); } };
  return (
    <div className="space-y-4">
      <h1>{t('nav_alerts')}</h1>
      <Banner kind="warn">{t('alertNote')}</Banner>
      <div className="card space-y-2">
        <h2>{t('thresholds')}</h2>
        <div className="flex gap-3 items-end flex-wrap">
          {['moderate', 'high'].map((k) => <div key={k}><label className="lbl">{t(k === 'moderate' ? 'moderateAbove' : 'highAbove')}</label><input className="inp w-28" type="number" value={th[k]} onChange={(e) => setTh({ ...th, [k]: e.target.value })} /></div>)}
          <button className="btn" onClick={save}>{t('save')}</button>
        </div>
        {msg && <Banner kind={msg.kind}>{msg.text}</Banner>}
      </div>
      {loading && <Spin />}{error && <Banner kind="err">{error}</Banner>}
      {data?.length === 0 && <p className="text-slate-500">{t('noData')}</p>}
      {data?.map((a) => (
        <div key={a.id} className="card space-y-2">
          <div className="flex items-center gap-2 flex-wrap"><Badge level={a.severity} /><b>{name(a)}</b>{a.is_demo ? <DemoTag /> : null}<span className="text-xs text-slate-400 ms-auto">{fmt(a.created_at)}</span></div>
          <p className="text-sm">{lang === 'ar' ? a.message_ar : a.message_en}</p>
          <div className="text-xs text-slate-400">{t('recommendations')}:</div>
          <ul className="list-disc ps-5 text-sm">{(a.recommendations?.[lang] || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
          <div className="text-xs text-amber-300/80">{t('origin')}: {a.origin}</div>
        </div>
      ))}
    </div>
  );
}
