'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show header on landing page
  if (pathname === '/') {
    return null;
  }
  
  return <AppHeader />;
}

