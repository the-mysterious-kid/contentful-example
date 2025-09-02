import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Translations } from '../../constants/translations';

// Initialize i18next
i18n.use(initReactI18next)
    .init({
        resources: {
            en: { translation: Translations.english },
            ar: { translation: Translations.arabic },
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already safes from xss
        }
    });

export default i18n;