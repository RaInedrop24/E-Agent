'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types';

interface HeaderProps {
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                Estate Portal
              </h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a
                  href="/dashboard"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="/transactions"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Transactions
                </a>
              </div>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col text-sm">
                    <span className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-gray-500">{user.email}</span>
                  </div>
                  <Badge variant={user.role === 'agent' ? 'default' : 'secondary'}>
                    {user.role === 'agent' ? 'Agent' : 'Buyer'}
                  </Badge>
                </div>
                <Button variant="outline" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" asChild>
                  <a href="/(auth)/login">Login</a>
                </Button>
                <Button asChild>
                  <a href="/(auth)/register">Register</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};