'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

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

  // Load branding from profile initially (if agent)
  useEffect(() => {
    if (profile?.role === 'agent' && profile.branding_settings) {
       // Check if branding_settings is an object and has props
       const settings = profile.branding_settings as any;
       if (settings.primary) {
         setColors(settings);
       }
       if (profile.branding_logo_url) {
         setLogoUrl(profile.branding_logo_url);
       }
    }
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
      // Reset to defaults if colors are cleared (optional, or just leave as is)
      // root.style.removeProperty('--primary');
      // root.style.removeProperty('--secondary');
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
