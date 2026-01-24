'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  title: string;
  title_en?: string | null;
  title_it?: string | null;
  title_de?: string | null;
  title_fr?: string | null;
  title_es?: string | null;
  agent_reference?: string | null;
}

interface EditTransactionTitleModalProps {
  transaction: Transaction;
  onSuccess?: () => void;
}

export function EditTransactionTitleModal({ transaction, onSuccess }: EditTransactionTitleModalProps) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [agentReference, setAgentReference] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleIt, setTitleIt] = useState('');
  const [titleDe, setTitleDe] = useState('');
  const [titleFr, setTitleFr] = useState('');
  const [titleEs, setTitleEs] = useState('');

  useEffect(() => {
    if (open) {
      // Initialize with current values
      setAgentReference(transaction.agent_reference || '');
      // Each language field should only use its own value, don't fall back to the generic 'title'
      setTitleEn(transaction.title_en || '');
      setTitleIt(transaction.title_it || '');
      setTitleDe(transaction.title_de || '');
      setTitleFr(transaction.title_fr || '');
      setTitleEs(transaction.title_es || '');

      // If all translation fields are empty but main title exists,
      // try to detect which language it should be in (fallback to EN)
      if (!transaction.title_en && !transaction.title_it && !transaction.title_de &&
          !transaction.title_fr && !transaction.title_es && transaction.title) {
        // For backward compatibility, put it in EN field
        setTitleEn(transaction.title);
      }

      setError(null);
    }
  }, [open, transaction]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titleEn.trim()) {
      setError(t('error.enterTitle'));
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Get the title in the user's language for the main title field
      const userLangTitle = 
        (language === 'it' && titleIt.trim()) ? titleIt.trim() :
        (language === 'de' && titleDe.trim()) ? titleDe.trim() :
        (language === 'fr' && titleFr.trim()) ? titleFr.trim() :
        (language === 'es' && titleEs.trim()) ? titleEs.trim() :
        titleEn.trim(); // Fallback to English

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          title: userLangTitle, // Main title in user's language
          agent_reference: agentReference.trim() || null,
          title_en: titleEn.trim(),
          title_it: titleIt.trim() || null,
          title_de: titleDe.trim() || null,
          title_fr: titleFr.trim() || null,
          title_es: titleEs.trim() || null,
        })
        .eq('id', transaction.id);

      if (updateError) throw updateError;

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || t('error.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          {t('action.edit')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('transaction.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('transaction.editTitleDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            {/* Agent Reference */}
            <div className="space-y-2">
              <Label htmlFor="agent_reference">{t('transactions.agentReference')}</Label>
              <Input
                id="agent_reference"
                value={agentReference}
                onChange={(e) => setAgentReference(e.target.value)}
                disabled={isSaving}
                placeholder={t('transactions.agentReferencePlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('transactions.agentReferenceHelp')}
              </p>
            </div>

            {/* English */}
            <div className="space-y-2">
              <Label htmlFor="title_en">
                EN - {t('lang.english')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title_en"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            {/* Italian */}
            <div className="space-y-2">
              <Label htmlFor="title_it">IT - {t('lang.italian')}</Label>
              <Input
                id="title_it"
                value={titleIt}
                onChange={(e) => setTitleIt(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {/* German */}
            <div className="space-y-2">
              <Label htmlFor="title_de">DE - {t('lang.german')}</Label>
              <Input
                id="title_de"
                value={titleDe}
                onChange={(e) => setTitleDe(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {/* French */}
            <div className="space-y-2">
              <Label htmlFor="title_fr">FR - {t('lang.french')}</Label>
              <Input
                id="title_fr"
                value={titleFr}
                onChange={(e) => setTitleFr(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {/* Spanish */}
            <div className="space-y-2">
              <Label htmlFor="title_es">ES - {t('lang.spanish')}</Label>
              <Input
                id="title_es"
                value={titleEs}
                onChange={(e) => setTitleEs(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving || !titleEn.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('action.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

