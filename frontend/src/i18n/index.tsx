import React, { createContext, useContext, useState, useCallback } from 'react';
import { es, type TranslationKey } from './es';
import { en } from './en';

type Dict = Partial<Record<TranslationKey, string>>;

const DICTS: Record<string, Dict> = { es, en };
const STORAGE_KEY = 'lang';

export const AVAILABLE_LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

function readStoredLang(): string | null {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
}

function initialLang(): string {
  const stored = readStoredLang();
  return stored && DICTS[stored] ? stored : 'es';
}

interface I18nValue {
  lang: string;
  t: (key: TranslationKey) => string;
  setLang: (lang: string) => void;
}

const I18nContext = createContext<I18nValue>({
  lang: 'es',
  t: (key: TranslationKey) => es[key],
  setLang: () => {},
});

export const I18nProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<string>(() => initialLang());

  const t = useCallback((key: TranslationKey) => DICTS[lang]?.[key] ?? es[key], [lang]);

  const setLang = useCallback((next: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  return <I18nContext.Provider value={{ lang, t, setLang }}>{children}</I18nContext.Provider>;
};

export const useT = (): I18nValue => useContext(I18nContext);
