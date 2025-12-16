'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { t, tVar, TranslationKey } from '@/lib/ui-translations';
import type { SupportedLanguage } from '@/lib/translation';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
  tVar: (key: TranslationKey, variables: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');

  // Initialize language from profile or localStorage
  useEffect(() => {
    if (profile?.preferred_language) {
      setSelectedLanguage(profile.preferred_language as SupportedLanguage);
    } else {
      // Check localStorage for language preference (for landing page)
      const storedLang = localStorage.getItem('preferred_language') as SupportedLanguage | null;
      if (storedLang && ['en', 'it', 'es', 'fr', 'de'].includes(storedLang)) {
        setSelectedLanguage(storedLang);
      }
    }
  }, [profile]);

  const language: SupportedLanguage = profile?.preferred_language 
    ? (profile.preferred_language as SupportedLanguage)
    : selectedLanguage;

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

