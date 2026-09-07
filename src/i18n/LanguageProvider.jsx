import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import en from './en.json';
import ta from './ta.json';
import hi from './hi.json';
import { getPlaceName } from './places';

const DICTIONARIES = { en, ta, hi };
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिंदी' },
];

const STORAGE_KEY = 'fundiq.language';

const LanguageContext = createContext(null);

function readStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && DICTIONARIES[stored]) return stored;
  } catch {
    // localStorage unavailable (private mode, SSR, etc.) -- fall through
  }
  return 'en';
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? String(vars[key]) : `{{${key}}}`));
}

// Shared foundation for all four workspaces (A4.3). Selected language
// persists in localStorage and survives role/workspace switches because it
// lives above the role-specific dashboards in the tree.
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  const setLanguage = useCallback((lang) => {
    if (!DICTIONARIES[lang]) return;
    setLanguageState(lang);
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const t = useCallback((key, vars) => {
    const dict = DICTIONARIES[language] || en;
    const value = getByPath(dict, key) ?? getByPath(en, key) ?? key;
    return typeof value === 'string' ? interpolate(value, vars) : value;
  }, [language]);

  const placeName = useCallback((name) => getPlaceName(name, language), [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    placeName,
    languages: SUPPORTED_LANGUAGES,
  }), [language, setLanguage, t, placeName]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return ctx;
}
