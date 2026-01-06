'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

interface BrandingContextType {
  logoUrl: string | null;
  colors: BrandColors | null;
  setBranding: (logo: string | null, colors: BrandColors | null) => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [colors, setColors] = useState<BrandColors | null>(null);

  // Load branding
  useEffect(() => {
    async function loadBranding() {
      if (!profile) return;

      // 1. If Agent: Load from own profile
      if (profile.role === 'agent' && profile.branding_settings) {
         const settings = profile.branding_settings as any;
         if (settings.primary) setColors(settings);
         if (profile.branding_logo_url) setLogoUrl(profile.branding_logo_url);
         return;
      }

      // 2. If Buyer: Use platform branding (no agent branding on dashboard)
      // Transaction-specific pages will apply agent branding dynamically
      // via useTransactionBranding hook
      if (profile.role === 'buyer') {
        // Reset to platform branding
        setColors(null);
        setLogoUrl(null);
        return;
      }
    }

    loadBranding();
  }, [profile]);

  // Apply colors to CSS variables whenever they change
  useEffect(() => {
    const root = document.documentElement;
    if (colors) {
      if (colors.primary) root.style.setProperty('--primary', colors.primary);
      if (colors.secondary) root.style.setProperty('--secondary', colors.secondary);
      if (colors.background) root.style.setProperty('--background', colors.background);
      if (colors.text) {
        root.style.setProperty('--foreground', colors.text);
        // Ensure card/popover text also matches if the background is changing drastically
        root.style.setProperty('--card-foreground', colors.text);
        root.style.setProperty('--popover-foreground', colors.text);
      }
    } else {
      // Reset to defaults when colors are cleared (buyer dashboard)
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--popover-foreground');
    }
  }, [colors]);

  return (
    <BrandingContext.Provider value={{ logoUrl, colors, setBranding: (l, c) => { setLogoUrl(l); setColors(c); } }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}
