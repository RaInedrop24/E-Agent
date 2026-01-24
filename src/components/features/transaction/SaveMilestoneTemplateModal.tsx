'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Milestone {
  code: string;
  label_en: string;
  label_it?: string | null;
  label_de?: string | null;
  label_fr?: string | null;
  label_es?: string | null;
  label_pl?: string | null;
}

interface SaveMilestoneTemplateModalProps {
  milestones: Milestone[];
  onSuccess?: () => void;
}

export function SaveMilestoneTemplateModal({ milestones, onSuccess }: SaveMilestoneTemplateModalProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    if (milestones.length === 0) {
      setError('Cannot save an empty template. Add at least one milestone first.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Prepare milestones data for RPC function
      const milestonesData = milestones.map((m) => ({
        code: m.code,
        label_en: m.label_en,
        label_it: m.label_it || null,
        label_de: m.label_de || null,
        label_fr: m.label_fr || null,
        label_es: m.label_es || null,
        label_pl: m.label_pl || null,
      }));

      // Call the RPC function
      const { data, error: rpcError } = await supabase.rpc('save_milestone_template', {
        p_template_name: templateName.trim(),
        p_description: description.trim() || null,
        p_milestones: milestonesData,
      });

      if (rpcError) throw rpcError;

      // Check if the RPC function returned an error
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to save template');
      }

      // Success
      setOpen(false);
      setTemplateName('');
      setDescription('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setTemplateName('');
      setDescription('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Save className="h-4 w-4" />
          Save as Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Milestone Template</DialogTitle>
          <DialogDescription>
            Save these {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} as a reusable template for future transactions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="grid gap-4 py-4">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="template_name">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="template_name"
                placeholder="e.g., Standard Property Sale"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={isSaving}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe when to use this template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>

            {/* Preview Info */}
            <div className="rounded-md bg-muted p-3 text-sm">
              <div className="font-medium mb-1">Template Preview:</div>
              <div className="text-muted-foreground">
                This template will include {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving || !templateName.trim()}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
