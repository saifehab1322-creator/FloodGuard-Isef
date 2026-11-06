import { useApp } from './ctx.jsx';
import { Badge, Banner } from './ui.jsx';

export default function Result({ r }) {
  const { t } = useApp();
  if (!r) return null;
  const rawText = (f) => {
    if (f.key === 'rainfall') return `${f.raw.intensity ?? '—'} mm/h · ${f.raw.total ?? '—'} mm`;
    if (f.key === 'terrain') return f.raw ? t('terr_' + f.raw) : '—';
    return f.raw ?? '—';
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-5xl font-bold text-cyan-300">{r.score === null ? '—' : r.score}<span className="text-lg text-slate-400">/100</span></div>
        <div className="space-y-1">
          <Badge level={r.level} />
          <div className="text-sm text-slate-400">{t('reliability')}: <b className="text-slate-200">{t('rel_' + r.reliability)}</b> ({Math.round(r.coverage * 100)}%)</div>
        </div>
      </div>
      {r.level === 'insufficient' && <Banner kind="warn">{t('insufficientMsg')}</Banner>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="text-slate-400 text-xs"><tr>{['col_factor', 'col_value', 'col_norm', 'col_weight', 'col_contrib'].map((k) => <th key={k} className="text-start py-1">{t(k)}</th>)}</tr></thead>
          <tbody>
            {r.factors.map((f) => (
              <tr key={f.key} className="border-t border-cyan-400/10">
                <td className="py-1.5">{t('fac_' + f.key)}</td>
                <td>{rawText(f)}</td>
                <td>{f.normalized === null ? '—' : Math.round(f.normalized * 100) + '%'}</td>
                <td>{f.available ? Math.round(f.effectiveWeight * 100) + '%' : '0%'}</td>
                <td className="w-40"><div className="flex items-center gap-2"><div className="h-2 rounded bg-cyan-400" style={{ width: Math.min(100, f.contribution) + '%' }} /><span>{f.contribution}</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {r.missing.map((m) => <Banner kind="warn" key={m}>{t('missing_' + m)}</Banner>)}
      <p className="text-xs text-slate-400">{t('disclaimer')}</p>
    </div>
  );
}
