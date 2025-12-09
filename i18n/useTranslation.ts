import { useLanguage } from '../contexts/LanguageContext';
import { translations } from './translations';

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (path: string): string => {
    const keys = path.split('.');
    let value: any = translations;

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        console.warn(`Translation missing for key: ${path}`);
        return path;
      }
    }

    return value[language] || value.en || path;
  };

  return { t, language };
};
