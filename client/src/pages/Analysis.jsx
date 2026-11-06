import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
import LocationPicker from '../LocationPicker.jsx';
import Result from '../Result.jsx';
import { Badge, Banner, Spin, useFetch } from '../ui.jsx';
import { WeatherMeta } from '../WeatherView.jsx';

const EMPTY = { rainfallIntensity: '', totalRainfall: '', durationHours: '', soilMoisture: '', elevation: '', terrain: '' };
const FIELDS = [['rainfallIntensity', 'f_intensity', '0.1'], ['totalRainfall', 'f_total', '0.1'], ['durationHours', 'f_duration', '1'], ['soilMoisture', 'f_soil', '0.01'], ['elevation', 'f_elevation', '1']];
const W0 = { rainfall: 0.5, soil: 0.2, elevation: 0.15, terrain: 0.15 };

export default function Analysis() {
  const { t, name, demo } = useApp();
  const [loc, setLoc] = useState(null);
  const [inp, setInp] = useState(EMPTY);
  const [source, setSource] = useState('manual');
  const [weights, setWeights] = useState(W0);
  const [wx, setWx] = useState(null);
  const [res, setRes] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cmp, setCmp] = useState([]);
  const { data: cfg } = useFetch('/config');
  const { data: scen } = useFetch('/demo/scenarios');
  useEffect(() => { setInp(EMPTY); setRes(null); setWx(null); setSource('manual'); setMsg(null); }, [demo]);

  const edit = (k, v) => { setInp({ ...inp, [k]: v }); setRes(null); setSource((s) => (s === 'api' ? 'mixed' : s)); };
  const clean = () => Object.fromEntries(Object.entries(inp).map(([k, v]) => [k, v === '' ? null : k === 'terrain' ? v : Number(v)]));
  const wBody = () => Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, Number(v)]));
  const guard = async (fn) => { setBusy(true); setMsg(null); try { await fn(); } catch (e) { setMsg({ kind: 'err', text: e.message }); } setBusy(false); };

  const fetchWx = () => guard(async () => {
    const w = await api('/weather/' + loc.id);
    setWx(w); setSource('api'); setRes(null);
    const a = w.assessmentInputs;
    setInp({ ...EMPTY, ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v ?? ''])) });
  });
  const loadScenario = (id) => { const s = scen.find((x) => x.id === id); if (s) { setInp({ ...EMPTY, ...s.inputs }); setSource('demo'); setRes(null); } };
  const run = () => guard(async () => setRes(await api('/risk/calculate', { method: 'POST', body: { inputs: clean(), weights: wBody() } })));
  const save = () => guard(async () => {
    await api('/assessments', { method: 'POST', body: { locationId: loc.id, inputs: clean(), weights: wBody(), inputSource: demo ? 'demo' : source, isDemo: demo } });
    setMsg({ kind: 'info', text: t('saved') });
  });
  const addCmp = () => setCmp([...cmp, { label: `${name(loc)} #${cmp.length + 1}`, r: res }]);

  return (
    <div className="space-y-4">
      <h1>{t('nav_analysis')}</h1>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <LocationPicker value={loc} onChange={setLoc} />
          {!demo && <button className="btn2" disabled={!loc || busy} onClick={fetchWx}>☁ {t('fetchWeather')}</button>}
          {demo && scen && (
            <select className="inp" defaultValue="" onChange={(e) => loadScenario(e.target.value)}>
              <option value="" disabled>{t('loadScenario')}</option>
              {scen.map((s) => <option key={s.id} value={s.id}>{t('demoTag')} · {name(s)}</option>)}
            </select>
          )}
          {wx && !demo && <WeatherMeta w={wx} />}
          <h2>{t('inputs')}</h2>
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map(([k, lk, step]) => <div key={k}><label className="lbl">{t(lk)}</label><input className="inp" type="number" step={step} value={inp[k]} onChange={(e) => edit(k, e.target.value)} /></div>)}
            <div><label className="lbl">{t('f_terrain')}</label>
              <select className="inp" value={inp.terrain} onChange={(e) => edit('terrain', e.target.value)}>
                <option value="">{t('terr_none')}</option>{(cfg?.terrain || []).map((k) => <option key={k} value={k}>{t('terr_' + k)}</option>)}
              </select></div>
          </div>
          <details><summary className="cursor-pointer text-sm text-cyan-300">{t('weights')}</summary>
            <div className="grid grid-cols-4 gap-2 mt-2">{Object.keys(W0).map((k) => <div key={k}><label className="lbl">{t('fac_' + k).split(' ')[0]}</label><input className="inp" type="number" step="0.05" min="0" value={weights[k]} onChange={(e) => { setWeights({ ...weights, [k]: e.target.value }); setRes(null); }} /></div>)}</div>
          </details>
          <div className="flex gap-2 flex-wrap"><button className="btn" onClick={run} disabled={busy || !loc}>{busy ? <Spin /> : t('run')}</button></div>
          {msg && <Banner kind={msg.kind}>{msg.text}</Banner>}
        </div>
        <div className="card">
          <h2>{t('breakdown')}</h2>
          {res ? (<>
            <Result r={res} />
            <div className="flex gap-2 mt-3 flex-wrap"><button className="btn" onClick={save} disabled={busy}>{t('save')}</button><button className="btn2" onClick={addCmp}>{t('addCompare')}</button></div>
          </>) : <p className="text-slate-500 text-sm">{t('noData')}</p>}
        </div>
      </div>
      {cmp.length > 0 && (
        <div className="card space-y-3">
          <h2>{t('compare')}</h2>
          <div className="h-56"><ResponsiveContainer><BarChart data={cmp.map((c) => ({ name: c.label, score: c.r.score ?? 0 }))}><CartesianGrid stroke="#1e3a52" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#64748b" fontSize={11} /><YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} /><Tooltip contentStyle={{ background: '#0f2238' }} /><Bar dataKey="score" fill="#22d3ee" /></BarChart></ResponsiveContainer></div>
          <table className="w-full text-sm"><tbody>{cmp.map((c, i) => <tr key={i} className="border-t border-cyan-400/10"><td className="py-1">{c.label}</td><td>{c.r.score ?? '—'}</td><td><Badge level={c.r.level} /></td><td>{t('rel_' + c.r.reliability)}</td></tr>)}</tbody></table>
          <button className="btn2" onClick={() => setCmp([])}>✕</button>
        </div>
      )}
    </div>
  );
}
