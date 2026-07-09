'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useSyncExternalStore } from 'react';
import { useAuth } from './AuthContext';
import { t, tVar, loadLanguage, TranslationKey } from '@/lib/translations/client';
import { isSupportedLanguage } from '@/lib/constants';
import type { SupportedLanguage } from '@/lib/translation';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
  tVar: (key: TranslationKey, variables: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// Hydration-safe read of the anonymous-visitor language preference
// (used on the landing page before any profile exists)
const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
};
const getStoredLanguage = () => localStorage.getItem('preferred_language');
const getServerStoredLanguage = () => null;

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  // Explicit in-session choice (e.g. landing page language switcher)
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);
  const storedLanguage = useSyncExternalStore(
    subscribeToStorage,
    getStoredLanguage,
    getServerStoredLanguage
  );
  // Bumped when a language dictionary finishes loading so consumers re-render
  // from the English fallback to the real translations
  const [, setLoadedTick] = useState(0);

  // Precedence: profile setting > explicit in-session choice > localStorage > English
  const language: SupportedLanguage = profile?.preferred_language
    ? (profile.preferred_language as SupportedLanguage)
    : selectedLanguage ?? (isSupportedLanguage(storedLanguage) ? storedLanguage : 'en');

  // Fetch the dictionary chunk for the active language (no-op for English
  // and already-loaded languages)
  useEffect(() => {
    let cancelled = false;
    loadLanguage(language).then(() => {
      if (!cancelled) setLoadedTick((tick) => tick + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const handleSetLanguage = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    localStorage.setItem('preferred_language', lang);
  };

  const translate = (key: TranslationKey) => t(key, language);
  const translateVar = (key: TranslationKey, variables: Record<string, string | number>) =>
    tVar(key, language, variables);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: translate, tVar: translateVar }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
