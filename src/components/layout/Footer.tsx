'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>© {year} The Property Gateway</span>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            {t('legal.privacyPolicy')}
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            {t('legal.termsOfService')}
          </Link>
          <Link href="/cookies" className="hover:text-foreground">
            {t('legal.cookiePolicy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
