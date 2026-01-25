'use client';

import { Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon } from 'lucide-react';
import Link from 'next/link';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
          data-tour="user-menu"
        >
          <div className="flex items-center gap-2">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="h-9 w-9 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-gray-700" />
              </div>
            )}
            <div className="hidden sm:flex flex-col leading-tight text-left">
              <span className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </div>
          <Badge variant={user.role === 'agent' ? 'default' : 'secondary'}>
            {user.role === 'agent' ? t('role.agent') : t('role.buyer')}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center cursor-pointer" data-tour="settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('nav.settings')}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="flex items-center cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('nav.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
