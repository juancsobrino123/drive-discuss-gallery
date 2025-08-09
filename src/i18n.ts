import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';

const getInitialLang = () => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;
  } catch {}
  const nav = navigator.language || (navigator as any).userLanguage || 'en';
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: getInitialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
  try { localStorage.setItem('lang', lng); } catch {}
});

export default i18n;
