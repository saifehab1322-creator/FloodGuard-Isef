import { createContext, useContext, useEffect, useState } from 'react';
import { dict } from './i18n.js';

const Ctx = createContext();
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [demo, setDemo] = useState(localStorage.getItem('demo') === '1');
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
  }, [lang]);
  useEffect(() => localStorage.setItem('demo', demo ? '1' : '0'), [demo]);
  const t = (k) => dict[lang][k] ?? dict.en[k] ?? k;
  const name = (l) => (l ? (lang === 'ar' ? l.name_ar || l.name_en : l.name_en) : '');
  const fmt = (d) => (d ? new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB') : '—');
  return <Ctx.Provider value={{ lang, setLang, demo, setDemo, t, name, fmt }}>{children}</Ctx.Provider>;
}
