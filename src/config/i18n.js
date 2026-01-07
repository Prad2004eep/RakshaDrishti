import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language resources
import bn from '../locales/bn.json';
import en from '../locales/en.json';
import gu from '../locales/gu.json';
import hi from '../locales/hi.json';
import kn from '../locales/kn.json';
import ml from '../locales/ml.json';
import mr from '../locales/mr.json';
import pa from '../locales/pa.json';
import ta from '../locales/ta.json';
import te from '../locales/te.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
  bn: { translation: bn },
  mr: { translation: mr },
  pa: { translation: pa },
  gu: { translation: gu },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en', // Always fallback to English if translation is missing
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Ensure missing keys show English instead of key name
    saveMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation: ${key} for language: ${lng}`);
      return fallbackValue || key;
    },
  });

export default i18n;

