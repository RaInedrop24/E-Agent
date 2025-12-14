'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { t, tVar, TranslationKey } from '@/lib/ui-translations';
import type { SupportedLanguage } from '@/lib/translation';

interface LanguageContextType {
  language: SupportedLanguage;
  t: (key: TranslationKey) => string;
  tVar: (key: TranslationKey, variables: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const language: SupportedLanguage = (profile?.preferred_language as SupportedLanguage) || 'en';

  const translate = (key: TranslationKey) => t(key, language);
  const translateVar = (key: TranslationKey, variables: Record<string, string | number>) => 
    tVar(key, language, variables);

  return (
    <LanguageContext.Provider value={{ language, t: translate, tVar: translateVar }}>
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

