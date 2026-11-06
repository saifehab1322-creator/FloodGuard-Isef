import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useApp } from './ctx.jsx';

export const LEVEL_COLOR = { low: '#34d399', moderate: '#fbbf24', high: '#f87171', insufficient: '#64748b' };

export function Badge({ level }) {
  const { t } = useApp();
  return <span style={{ background: LEVEL_COLOR[level] + '33', color: LEVEL_COLOR[level] }} className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">{t('lvl_' + level)}</span>;
}
export function DemoTag() {
  const { t } = useApp();
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300">{t('demoTag')}</span>;
}
export function Banner({ kind = 'info', children }) {
  const c = { info: 'border-cyan-400/40 bg-cyan-400/10', warn: 'border-amber-400/50 bg-amber-400/10 text-amber-200', err: 'border-red-400/50 bg-red-400/10 text-red-200' }[kind];
  return <div className={`border rounded-lg px-3 py-2 text-sm ${c}`}>{children}</div>;
}
export const Spin = () => <div className="inline-block w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />;
export function Stat({ label, value, unit }) {
  const { t } = useApp();
  return (
    <div className="bg-navy/60 rounded-xl p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-xl font-bold text-cyan-300">{value === null || value === undefined ? <span className="text-sm text-slate-500">{t('unavailable')}</span> : <>{value}<span className="text-xs text-slate-400 ms-1">{unit}</span></>}</div>
    </div>
  );
}
export function useFetch(url, interval) {
  const [s, set] = useState({ data: null, error: null, loading: true });
  const load = useCallback(() => {
    if (!url) return;
    api(url).then((data) => set({ data, error: null, loading: false })).catch((e) => set((p) => ({ ...p, error: e.message, loading: false })));
  }, [url]);
  useEffect(() => {
    set((p) => ({ ...p, loading: true }));
    load();
    if (interval) { const i = setInterval(load, interval); return () => clearInterval(i); }
  }, [load, interval]);
  return { ...s, reload: load };
}
