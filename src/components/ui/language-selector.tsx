'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t('landing.selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.code.toUpperCase()} - {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

