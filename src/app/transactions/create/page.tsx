'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { Combobox } from '@/components/ui/combobox';

interface Buyer {
  id: string;
  full_name: string;
  email: string;
}

interface MilestoneTemplate {
  id: string;
  template_name: string;
  description: string | null;
  milestone_count: number;
}

export default function CreateTransactionPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [agentReference, setAgentReference] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyUrl, setPropertyUrl] = useState('');
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyerIds, setSelectedBuyerIds] = useState<string[]>([]);
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === 'agent') {
      fetchBuyers();
      fetchTemplates();
    }
  }, [profile]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      if (!supabase || !user) return;

      // Fetch templates using RPC function
      const { data, error } = await supabase.rpc('get_milestone_templates');

      if (error) throw error;

      setTemplates(data || []);
      setLoadingTemplates(false);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      // Don't show error to user - templates are optional
      setLoadingTemplates(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      setLoadingBuyers(true);
      if (!supabase || !user) return;

      // Fetch buyers associated with this agent
      const { data: associations, error } = await supabase
        .from('buyer_agent_associations')
        .select(`
          buyer_id,
          profiles!buyer_agent_associations_buyer_id_fkey (
            id,
            full_name
          )
        `)
        .eq('agent_id', user.id);

      if (error) throw error;

      const buyersList = (associations || []).map((a: any) => ({
        id: (a.profiles as any).id,
        full_name: (a.profiles as any).full_name || 'Unknown Buyer',
        email: (a.profiles as any).id, // Store ID as placeholder
      }));

      setBuyers(buyersList);
      setLoadingBuyers(false);
    } catch (err: any) {
      console.error('Error fetching buyers:', err);
      setError(t('error.loadBuyersFailed'));
      setLoadingBuyers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !profile) {
      setError(t('error.mustBeLoggedIn'));
      return;
    }

    if (profile.role !== 'agent') {
      setError(t('transactions.onlyAgentsCreate'));
      return;
    }

    if (!title.trim()) {
      setError(t('error.enterTitle'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      // Auto-translate the title to supported languages
      const titleTranslations: Record<string, string> = {};
      const trimmedTitle = title.trim();
      const userLang = (profile?.preferred_language as string) || 'en';
      
      console.log('[CreateTransaction] User language:', userLang, 'Title:', trimmedTitle);
      
      // Set the original language version
      titleTranslations[`title_${userLang}`] = trimmedTitle;

      // Translate to other languages
      try {
        const languages = ['en', 'it', 'de', 'fr', 'es'].filter(lang => lang !== userLang);
        
        console.log('[CreateTransaction] Translating to languages:', languages);
        
        const translationPromises = languages.map(async (targetLang) => {
          try {
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: trimmedTitle,
                targetLang,
                sourceLang: userLang,
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log(`[CreateTransaction] Translated to ${targetLang}:`, data.translatedText);
              return { lang: targetLang, text: data.translatedText };
            } else {
              console.error(`[CreateTransaction] Translation failed for ${targetLang}:`, await response.text());
            }
          } catch (err) {
            console.error(`[CreateTransaction] Translation error for ${targetLang}:`, err);
          }
          return null;
        });

        const translations = await Promise.all(translationPromises);
        translations.forEach(result => {
          if (result) {
            titleTranslations[`title_${result.lang}`] = result.text;
          }
        });
        
        console.log('[CreateTransaction] Final titleTranslations:', titleTranslations);
      } catch (translationError) {
        console.error('[CreateTransaction] Translation error:', translationError);
        // Continue without translations - not critical
      }

      // Create transaction with translated titles
      // Use the user's language as the main title (for backward compatibility)
      const mainTitle = titleTranslations[`title_${userLang}`] || trimmedTitle;
      
      console.log('[CreateTransaction] Main title (user language):', mainTitle);
      
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          title: mainTitle, // Main title in user's language for backward compatibility
          ...titleTranslations,
          agent_reference: agentReference.trim() || null,
          property_address: propertyAddress.trim() || null,
          property_url: propertyUrl.trim() || null,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (txError) throw txError;

      if (!transaction) {
        throw new Error('Transaction created but no data returned');
      }

      // Create milestones - either from default or selected template
      if (selectedTemplateId === 'default') {
        // Use default milestones
        const { error: milestonesError } = await supabase.rpc('create_default_milestones', {
          p_transaction_id: transaction.id,
        });

        if (milestonesError) {
          console.error('[CreateTransaction] Error creating default milestones:', milestonesError);
          // Don't throw - transaction is already created, we can add milestones manually later
        }
      } else {
        // Apply selected template
        const { data: applyResult, error: applyError } = await supabase.rpc('apply_milestone_template', {
          p_transaction_id: transaction.id,
          p_template_id: selectedTemplateId,
        });

        if (applyError) {
          console.error('[CreateTransaction] Error applying template:', applyError);
          // Fall back to default milestones
          const { error: milestonesError } = await supabase.rpc('create_default_milestones', {
            p_transaction_id: transaction.id,
          });
          if (milestonesError) {
            console.error('[CreateTransaction] Error creating fallback milestones:', milestonesError);
          }
        } else if (applyResult && !applyResult.success) {
          console.error('[CreateTransaction] Template application failed:', applyResult.error);
          // Fall back to default milestones
          const { error: milestonesError } = await supabase.rpc('create_default_milestones', {
            p_transaction_id: transaction.id,
          });
          if (milestonesError) {
            console.error('[CreateTransaction] Error creating fallback milestones:', milestonesError);
          }
        }
      }

      // Add selected buyers to transaction
      if (selectedBuyerIds.length > 0) {
        const participantsToAdd = selectedBuyerIds.map(buyerId => ({
          transaction_id: transaction.id,
          profile_id: buyerId,
          participant_role: 'buyer',
        }));

        const { error: participantsError } = await supabase
          .from('transaction_participants')
          .insert(participantsToAdd);

        if (participantsError) {
          console.error('[CreateTransaction] Error adding buyers:', participantsError);
          // Don't throw - transaction is created, buyers can be added later
        }
      }

      // Redirect to the new transaction
      router.push(`/transaction/${transaction.id}`);
    } catch (err: any) {
      console.error('[CreateTransaction] Error:', err);
      setError(err.message || t('error.createTransactionFailed'));
      setLoading(false);
    }
  };

  // Redirect if not an agent
  if (profile && profile.role !== 'agent') {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('buyers.accessDenied')}</CardTitle>
            <CardDescription>{t('transactions.onlyAgentsCreate')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('transaction.backToDashboard')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('transactions.createNew')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('transactions.startTracking')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('transaction.details')}</CardTitle>
          <CardDescription>
            {t('transactions.createDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                {t('transactions.transactionTitle')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                placeholder={t('transactions.transactionTitlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('transactions.transactionTitleHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentReference">{t('transactions.agentReference')}</Label>
              <Input
                id="agentReference"
                type="text"
                placeholder={t('transactions.agentReferencePlaceholder')}
                value={agentReference}
                onChange={(e) => setAgentReference(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('transactions.agentReferenceHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyAddress">{t('transactions.propertyAddressOptional')}</Label>
              <Textarea
                id="propertyAddress"
                placeholder={t('transactions.propertyAddressPlaceholder')}
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                disabled={loading}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t('transactions.propertyAddressHelp')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyUrl">{t('transactions.propertyUrl')}</Label>
              <Input
                id="propertyUrl"
                type="url"
                placeholder={t('transactions.propertyUrlPlaceholder')}
                value={propertyUrl}
                onChange={(e) => setPropertyUrl(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t('transactions.propertyUrlHelp')}
              </p>
            </div>

            {/* Milestone Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Milestone Template</Label>
              {loadingTemplates ? (
                <div className="text-sm text-muted-foreground">Loading templates...</div>
              ) : (
                <>
                  <select
                    id="template"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    disabled={loading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="default">
                      Default Italian Property Purchase (5 milestones)
                    </option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.template_name} ({template.milestone_count} milestone{template.milestone_count !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                  {selectedTemplateId !== 'default' && (
                    <div className="text-xs text-muted-foreground">
                      {templates.find(t => t.id === selectedTemplateId)?.description || 'Custom milestone template'}
                    </div>
                  )}
                  {selectedTemplateId === 'default' && (
                    <p className="text-xs text-muted-foreground">
                      The standard 5-step milestone process for Italian property purchases
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Buyer Selection with Searchable Dropdown */}
            <div className="space-y-2">
              <Label>{t('transactions.inviteBuyersOptional')}</Label>
              {loadingBuyers ? (
                <div className="text-sm text-muted-foreground">{t('buyers.loading')}</div>
              ) : buyers.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {t('transactions.noBuyersFound')}{' '}
                  <Link href="/buyers" className="text-blue-600 hover:underline">
                    {t('buyers.createFirst')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Combobox
                    options={buyers.map(b => ({
                      value: b.id,
                      label: b.full_name
                    }))}
                    value=""
                    onSelect={(buyerId) => {
                      if (!selectedBuyerIds.includes(buyerId)) {
                        setSelectedBuyerIds([...selectedBuyerIds, buyerId]);
                      }
                    }}
                    placeholder={t('buyers.searchPlaceholder')}
                    emptyMessage={t('buyers.noneFound')}
                    disabled={loading}
                  />

                  {/* Selected buyers as removable tags */}
                  {selectedBuyerIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedBuyerIds.map(id => {
                        const buyer = buyers.find(b => b.id === id);
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {buyer?.full_name}
                            <button
                              type="button"
                              onClick={() => setSelectedBuyerIds(prev => prev.filter(bid => bid !== id))}
                              className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              disabled={loading}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t('transactions.searchBuyersHelp')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? t('transactions.creating') : t('transactions.create')}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline" disabled={loading}>
                  {t('action.cancel')}
                </Button>
              </Link>
            </div>

            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
              <strong>{t('transactions.whatHappensNext')}</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t('transactions.nextStep1')}</li>
                <li>{t('transactions.nextStep2')}</li>
                <li>{t('transactions.nextStep3')}</li>
                <li>{t('transactions.nextStep4')}</li>
              </ul>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
