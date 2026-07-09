'use client';

import { useState, useSyncExternalStore } from 'react';
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

// The cookie never changes externally during a session, so no subscription
// is needed — useSyncExternalStore just gives us a hydration-safe read
// (server snapshot pretends it's acknowledged so the banner never flashes
// during SSR/hydration).
const subscribeNoop = () => () => {};
const getAcknowledged = () => getCookieValue(COOKIE_NAME) === '1';
const getServerAcknowledged = () => true;

export function CookieBanner() {
  const { t } = useLanguage();
  const hasAck = useSyncExternalStore(subscribeNoop, getAcknowledged, getServerAcknowledged);
  const [dismissed, setDismissed] = useState(false);

  const acknowledge = () => {
    document.cookie = `${COOKIE_NAME}=1; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax`;
    setDismissed(true);
  };

  if (hasAck || dismissed) return null;

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
