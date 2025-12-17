'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';
import { User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const { t } = useLanguage();
  
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                  The Property Gateway
                </h1>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a
                  href="/dashboard"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.dashboard')}
                </a>
                <a
                  href="/transactions"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.transactions')}
                </a>
              </div>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center gap-2">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="h-9 w-9 rounded-full object-cover border border-gray-200"
                        title={`${user.firstName} ${user.lastName} • ${user.role === 'agent' ? 'Agent' : 'Buyer'}`}
                      />
                    ) : (
                      <div
                        className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 cursor-default"
                        title={`${user.firstName} ${user.lastName} • ${user.role === 'agent' ? 'Agent' : 'Buyer'}`}
                      >
                        <UserIcon className="h-5 w-5 text-gray-700" />
                      </div>
                    )}
                    <div className="hidden sm:flex flex-col leading-tight">
                      <span className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  </div>
                  <Badge variant={user.role === 'agent' ? 'default' : 'secondary'}>
                    {user.role === 'agent' ? t('role.agent') : t('role.buyer')}
                  </Badge>
                </div>
                <Button variant="outline" onClick={onLogout}>
                  {t('nav.logout')}
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/settings">{t('nav.settings')}</Link>
                </Button>
                {user.role === 'agent' && (
                  <Button asChild variant="outline">
                    <Link href="/admin">{t('nav.siteAdmin')}</Link>
                  </Button>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <a href="/login">{t('nav.login')}</a>
                </Button>
                <Button asChild>
                  <a href="/register">{t('nav.register')}</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};