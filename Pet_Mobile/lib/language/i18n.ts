import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resources } from './resources';
import { getLanguage } from '@/lib/storage/settingsStore';

if (!i18n.isInitialized) {
  const detectedLng = 'vi';

  i18n.use(initReactI18next).init({
    resources,
    lng: detectedLng,
    fallbackLng: 'vi',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

  // Load persisted language asynchronously — the fallback ensures vi is shown until this completes
  getLanguage().then((lang) => {
    if (lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
  }).catch(() => {});
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof resources.vi;
  }
}

export default i18n;
