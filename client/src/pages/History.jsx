import { Fragment, useState } from 'react';
import { useApp } from '../ctx.jsx';
import Result from '../Result.jsx';
import { Badge, Banner, DemoTag, Spin, useFetch } from '../ui.jsx';

export default function History() {
  const { t, name, fmt, demo } = useApp();
  const { data, error, loading } = useFetch('/assessments?demo=' + (demo ? 1 : 0), 30000);
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-4">
      <h1>{t('nav_history')}</h1>
      {loading && <Spin />}{error && <Banner kind="err">{error}</Banner>}
      {data?.length === 0 && <p className="text-slate-500">{t('noData')}</p>}
      {data?.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="text-xs text-slate-400"><tr>{['date', 'location', 'score', 'lvl_low', 'reliability', 'inputSource'].map((k, i) => <th key={i} className="text-start py-1">{k === 'lvl_low' ? '' : t(k)}</th>)}</tr></thead>
            <tbody>
              {data.map((a) => (<Fragment key={a.id}>
                <tr className="border-t border-cyan-400/10 cursor-pointer hover:bg-cyan-400/5" onClick={() => setOpen(open === a.id ? null : a.id)}>
                  <td className="py-2">{fmt(a.created_at)}</td><td>{name(a)}</td><td className="font-bold text-cyan-300">{a.score ?? '—'}</td><td><Badge level={a.level} /></td><td>{t('rel_' + a.reliability)}</td><td>{a.is_demo ? <DemoTag /> : t('src_' + a.input_source)}</td>
                </tr>
                {open === a.id && <tr><td colSpan={6} className="py-3"><Result r={a.breakdown} /></td></tr>}
              </Fragment>))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
