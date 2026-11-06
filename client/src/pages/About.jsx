import { useApp } from '../ctx.jsx';
import { Banner } from '../ui.jsx';

export default function About() {
  const { t } = useApp();
  return (
    <div className="space-y-4 max-w-3xl">
      <h1>{t('nav_about')}</h1>
      <div className="card space-y-3 text-sm leading-relaxed">
        {['about_p1', 'about_p2', 'about_p3', 'about_p4'].map((k) => <p key={k}>{t(k)}</p>)}
        <Banner kind="warn">{t('disclaimer')}</Banner>
        <div><h2>{t('team')}</h2><ul className="list-disc ps-5"><li>Saif El-Din Ehab Mohamed</li><li>Rana Mostafa Mahmoud</li></ul></div>
      </div>
    </div>
  );
}
