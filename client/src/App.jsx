import { NavLink, Route, Routes } from 'react-router-dom';
import { useApp } from './ctx.jsx';
import { Banner } from './ui.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analysis from './pages/Analysis.jsx';
import MapPage from './pages/MapPage.jsx';
import Weather from './pages/Weather.jsx';
import Alerts from './pages/Alerts.jsx';
import History from './pages/History.jsx';
import About from './pages/About.jsx';

const NAV = [['/', 'nav_dashboard'], ['/analysis', 'nav_analysis'], ['/map', 'nav_map'], ['/weather', 'nav_weather'], ['/alerts', 'nav_alerts'], ['/history', 'nav_history'], ['/about', 'nav_about']];

export default function App() {
  const { t, lang, setLang, demo, setDemo } = useApp();
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 md:min-h-screen bg-panel/90 border-e border-cyan-400/15 p-4 shrink-0">
        <div className="mb-4"><div className="text-xl font-bold text-cyan-300">🌊 {t('app')}</div><div className="text-xs text-slate-400">{t('tagline')}</div></div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto">
          {NAV.map(([to, k]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `px-3 py-2 rounded-lg whitespace-nowrap text-sm transition ${isActive ? 'bg-cyan-400/20 text-cyan-200' : 'hover:bg-cyan-400/10'}`}>{t(k)}</NavLink>
          ))}
        </nav>
        <div className="mt-4 space-y-2">
          <button className="btn2 w-full" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{lang === 'en' ? 'العربية' : 'English'}</button>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />{t('demoMode')}</label>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-6 space-y-4 min-w-0">
        {demo && <Banner kind="warn">{t('demoBanner')}</Banner>}
        <Routes>
          <Route path="/" element={<Dashboard />} /><Route path="/analysis" element={<Analysis />} /><Route path="/map" element={<MapPage />} />
          <Route path="/weather" element={<Weather />} /><Route path="/alerts" element={<Alerts />} /><Route path="/history" element={<History />} /><Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  );
}
