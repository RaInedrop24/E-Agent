'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import { motion } from 'framer-motion';
import * as flags from 'country-flag-icons/react/3x2';
import type { FlagComponent } from 'country-flag-icons/react/3x2';

// Map language codes to country codes for flags
const FLAG_MAP: Record<string, FlagComponent> = {
  'en': flags.GB,
  'it': flags.IT,
  'es': flags.ES,
  'fr': flags.FR,
  'de': flags.DE,
  'pl': flags.PL,
  'nl': flags.NL,
};

export function FlagLanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = language === lang.code;
        const FlagIcon = FLAG_MAP[lang.code];

        return (
          <motion.button
            key={lang.code}
            onClick={() => setLanguage(lang.code as typeof language)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-md'
              }
              border-2 ${isActive ? 'border-blue-700' : 'border-gray-200'}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: isActive ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            title={lang.name}
          >
            {FlagIcon && (
              <FlagIcon className="w-6 h-4 rounded-sm shadow-sm" title={lang.name} />
            )}
            <span className="text-sm font-semibold">{lang.code.toUpperCase()}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
