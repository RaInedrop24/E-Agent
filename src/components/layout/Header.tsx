'use client';

import { User } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { HamburgerMenu } from './HamburgerMenu';
import { UserMenu } from './UserMenu';
import { NotificationBell } from '@/components/features/NotificationBell';
import { useBranding } from '@/contexts/BrandingContext';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const { logoUrl } = useBranding();

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Hamburger Menu */}
          <div className="flex items-center">
            {user && <HamburgerMenu user={user} />}
          </div>

          {/* Center: Branded Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link
              href={user ? "/dashboard" : "/"}
              className="flex items-center gap-3"
              aria-label="The Property Gateway - Go to home page"
            >
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt="Agency Logo"
                  width={120}
                  height={40}
                  className="h-8 md:h-10 w-auto object-contain"
                  priority
                />
              )}
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent hover:from-blue-700 hover:via-purple-700 hover:to-blue-900 transition-all duration-300 cursor-pointer whitespace-nowrap">
                The Property Gateway
              </h1>
              {logoUrl && (
                <Image
                  src={logoUrl}
                  alt="Agency Logo"
                  width={120}
                  height={40}
                  className="h-8 md:h-10 w-auto object-contain"
                  priority
                />
              )}
            </Link>
          </div>

          {/* Right: Notifications & User Menu */}
          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            {user && onLogout && <UserMenu user={user} onLogout={onLogout} />}
          </div>
        </div>
      </div>
    </header>
  );
};