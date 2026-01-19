'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const COOKIE_NAME = 'estate-portal-cookie-notice';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const getCookieValue = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null;
};

export function CookieBanner() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAck = getCookieValue(COOKIE_NAME) === '1';
    setIsVisible(!hasAck);
  }, []);

  const acknowledge = () => {
    document.cookie = `${COOKIE_NAME}=1; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`;
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          {t('cookie.notice')}{' '}
          <Link href="/cookies" className="underline underline-offset-4 hover:text-foreground">
            {t('legal.cookiePolicy')}
          </Link>
          .
        </p>
        <Button type="button" size="sm" onClick={acknowledge}>
          {t('cookie.acknowledge')}
        </Button>
      </div>
    </div>
  );
}
