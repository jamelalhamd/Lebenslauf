import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, translations, monthNames, migrateLevel, LevelKey } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  formatDate: (dateStr: string) => string;
  getLevelDisplay: (level: string) => string;
  levelOptions: { key: LevelKey; label: string }[];
}

const LanguageContext = createContext<LanguageContextType | null>(null);
const LANG_KEY = 'cv-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'de' || stored === 'ar') return stored;
    return 'ar';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('dir', dir);
    html.setAttribute('lang', language);
    localStorage.setItem(LANG_KEY, language);
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language]?.[key] || translations.ar[key] || key;
  }, [language]);

  const formatDate = useCallback((dateStr: string): string => {
    if (!dateStr) return dateStr;
    const presentMap: Record<Language, string> = { ar: 'حتى الآن', en: 'Present', de: 'Gegenwart' };
    if (dateStr === 'حتى الآن' || dateStr === 'Present' || dateStr === 'Gegenwart') {
      return presentMap[language];
    }
    try {
      const [year, month] = dateStr.split('-');
      const months = monthNames[language];
      return `${months[parseInt(month) - 1]} ${year}`;
    } catch {
      return dateStr;
    }
  }, [language]);

  const getLevelDisplay = useCallback((level: string): string => {
    const key = migrateLevel(level);
    return translations[language]?.[`level.${key}`] || translations.ar[`level.${key}`] || level;
  }, [language]);

  const levelOptions: { key: LevelKey; label: string }[] = [
    { key: 'native', label: t('level.native') },
    { key: 'advanced', label: t('level.advanced') },
    { key: 'intermediate', label: t('level.intermediate') },
    { key: 'beginner', label: t('level.beginner') },
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, formatDate, getLevelDisplay, levelOptions }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
