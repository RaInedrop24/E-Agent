'use client';

import { Menu, LayoutDashboard, Receipt, Plus, Users, BookOpen, Shield, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from '@/types';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HamburgerMenuProps {
  user?: User | null;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ user }) => {
  const { t } = useLanguage();
  const { isSuperAdmin } = useSuperAdmin();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10" data-tour="hamburger-menu">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Dashboard - Accessible by all */}
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>{t('nav.dashboard')}</span>
          </Link>
        </DropdownMenuItem>

        {/* Transactions - Accessible by all, with sub-menu for agents */}
        {user.role === 'agent' ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center">
              <Receipt className="mr-2 h-4 w-4" />
              <span>{t('nav.transactions')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem asChild>
                <Link href="/transactions" className="cursor-pointer">
                  {t('nav.viewTransactions')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/transactions/create" className="flex items-center cursor-pointer" data-tour="create-transaction">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>{t('nav.createNew')}</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/transactions" className="flex items-center cursor-pointer">
              <Receipt className="mr-2 h-4 w-4" />
              <span>{t('nav.transactions')}</span>
            </Link>
          </DropdownMenuItem>
        )}

        {/* Manage Buyers - Agents only */}
        {user.role === 'agent' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/buyers" className="flex items-center cursor-pointer">
                <Users className="mr-2 h-4 w-4" />
                <span>{t('nav.manageBuyers')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/milestone-templates" className="flex items-center cursor-pointer">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>{t('nav.milestoneTemplates')}</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {/* Help - Accessible by all */}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/help" className="flex items-center cursor-pointer">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>{t('nav.help') || 'Help'}</span>
          </Link>
        </DropdownMenuItem>

        {/* Super Admin Dashboard - Super Admins only */}
        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard" className="flex items-center cursor-pointer">
                <Shield className="mr-2 h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-600">Super Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
