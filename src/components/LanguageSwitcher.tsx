import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Language } from '../i18n/translations';
import { useLanguage } from '../contexts/LanguageContext';

const langConfig: Record<Language, { code: string; label: string; flag: string }> = {
  ar: { code: 'AR', label: 'العربية', flag: '🇸🇦' },
  en: { code: 'EN', label: 'English', flag: '🇬🇧' },
  de: { code: 'DE', label: 'Deutsch', flag: '🇩🇪' },
};

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = langConfig[language];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl border border-border-gold px-2.5 py-2 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent sm:px-3"
      >
        <Globe size={14} />
        <span className="font-semibold">{current.flag} {current.code}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-border-gold bg-bg-secondary py-1 shadow-xl backdrop-blur-xl"
          style={{ insetInlineEnd: 0 }}>
          {(Object.keys(langConfig) as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => { setLanguage(lang); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-all hover:bg-accent/10 ${language === lang ? 'bg-accent/10 text-accent' : 'text-text-secondary'}`}
            >
              <span>{langConfig[lang].flag}</span>
              <span>{langConfig[lang].label}</span>
              {language === lang && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
