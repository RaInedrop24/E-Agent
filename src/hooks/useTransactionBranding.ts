// Hook for loading and applying transaction-specific agent branding
// This allows buyers to see different branding when viewing transactions from different agents

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

interface AgentBranding {
  logoUrl: string | null;
  colors: BrandColors | null;
  agentName: string;
  agentId: string;
}

/**
 * Load and apply agent branding for a specific transaction
 * @param transactionId - The ID of the transaction
 * @param applyBranding - Whether to apply branding to CSS variables (default: true)
 * @returns Agent branding data or null
 */
export function useTransactionBranding(transactionId: string | null, applyBranding: boolean = true): AgentBranding | null {
  const [branding, setBranding] = useState<AgentBranding | null>(null);

  useEffect(() => {
    if (!transactionId) {
      setBranding(null);
      return;
    }

    async function loadBranding() {
      try {
        const supabase = createClient();
        
        // Fetch transaction with agent profile
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id,
            created_by,
            agent:profiles!transactions_created_by_fkey (
              id,
              full_name,
              branding_logo_url,
              branding_settings
            )
          `)
          .eq('id', transactionId!)
          .single();

        if (error) {
          return;
        }

        if (data?.agent) {
          const agent = data.agent as any;
          const brandingData: AgentBranding = {
            logoUrl: agent.branding_logo_url || null,
            colors: agent.branding_settings || null,
            agentName: agent.full_name || 'Agent',
            agentId: agent.id,
          };

          setBranding(brandingData);

          // Apply branding to CSS variables if requested
          if (applyBranding && brandingData.colors) {
            const root = document.documentElement;
            const colors = brandingData.colors;
            
            if (colors.primary) root.style.setProperty('--primary', colors.primary);
            if (colors.secondary) root.style.setProperty('--secondary', colors.secondary);
            if (colors.background) root.style.setProperty('--background', colors.background);
            if (colors.text) {
              root.style.setProperty('--foreground', colors.text);
              root.style.setProperty('--card-foreground', colors.text);
              root.style.setProperty('--popover-foreground', colors.text);
            }
          }
        }
      } catch (err) {
        // ignore branding load errors
      }
    }

    loadBranding();

    // Cleanup: reset branding when component unmounts
    return () => {
      if (applyBranding) {
        const root = document.documentElement;
        root.style.removeProperty('--primary');
        root.style.removeProperty('--secondary');
        root.style.removeProperty('--background');
        root.style.removeProperty('--foreground');
        root.style.removeProperty('--card-foreground');
        root.style.removeProperty('--popover-foreground');
      }
    };
  }, [transactionId, applyBranding]);

  return branding;
}

