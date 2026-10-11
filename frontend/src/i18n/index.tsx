import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CATALOG, type Lang } from './messages';

const STORAGE_KEY = 'absenkan.lang';

/** Pick a stored language or fall back to the browser language, then 'id'. */
function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'id' || stored === 'en') return stored;
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
      return 'en';
    }
  } catch {
    /* localStorage unavailable */
  }
  return 'id';
}

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  /** Translate a catalog key, substituting `{placeholder}` tokens. */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Locale string for the `Intl` / `toLocaleString` APIs. */
  locale: string;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === 'id' ? 'en' : 'id';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = CATALOG[lang];
      let str = dict[key] ?? CATALOG.id[key] ?? key;
      if (params) {
        str = str.replace(/\{(\w+)\}/g, (_, k: string) =>
          params[k] !== undefined ? String(params[k]) : `{${k}}`,
        );
      }
      return str;
    },
    [lang],
  );

  const value = useMemo<I18nState>(
    () => ({ lang, setLang, toggle, t, locale: lang === 'id' ? 'id-ID' : 'en-US' }),
    [lang, setLang, toggle, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n harus dipakai di dalam I18nProvider');
  return ctx;
}
