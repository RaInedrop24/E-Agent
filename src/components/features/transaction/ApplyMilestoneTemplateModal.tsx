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
import { Loader2, FileDown, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MilestoneTemplate {
  id: string;
  template_name: string;
  description: string | null;
  milestone_count: number;
}

interface ApplyMilestoneTemplateModalProps {
  transactionId: string;
  onSuccess?: () => void;
}

export function ApplyMilestoneTemplateModal({ transactionId, onSuccess }: ApplyMilestoneTemplateModalProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      if (!supabase) return;

      // Call RPC function to get templates
      const { data, error: rpcError } = await supabase.rpc('get_milestone_templates');

      if (rpcError) throw rpcError;

      setTemplates(data || []);
    } catch (err) {
      setError('Failed to load templates: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }

    if (!confirm(
      '⚠️ WARNING: This will PERMANENTLY DELETE all existing milestones for this transaction and replace them with the template milestones.\n\n' +
      'Any milestone completion status will be lost.\n\n' +
      'Are you sure you want to continue?'
    )) {
      return;
    }

    try {
      setIsApplying(true);
      setError(null);

      // Call the RPC function to apply template
      const { data, error: rpcError } = await supabase.rpc('apply_milestone_template', {
        p_transaction_id: transactionId,
        p_template_id: selectedTemplateId,
      });

      if (rpcError) throw rpcError;

      // Check if the RPC function returned an error
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to apply template');
      }

      // Success
      setOpen(false);
      setSelectedTemplateId('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setSelectedTemplateId('');
      setError(null);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="h-4 w-4" />
          Apply Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply Milestone Template</DialogTitle>
          <DialogDescription>
            Replace current milestones with a saved template
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleApply}>
          <div className="grid gap-4 py-4">
            {/* Warning Box */}
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-yellow-800">
                    Warning: This action will delete all existing milestones
                  </p>
                  <p className="text-xs text-yellow-700">
                    All current milestones, including their completion status, will be permanently removed
                    and replaced with the template milestones.
                  </p>
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template_select">
                Select Template <span className="text-red-500">*</span>
              </Label>
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center rounded-md bg-muted">
                  No templates available. Create a template first from the milestones page.
                </div>
              ) : (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={isApplying}>
                  <SelectTrigger id="template_select">
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{template.template_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({template.milestone_count} step{template.milestone_count !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="font-medium">{selectedTemplate.template_name}</div>
                {selectedTemplate.description && (
                  <div className="text-muted-foreground text-xs">{selectedTemplate.description}</div>
                )}
                <div className="text-muted-foreground text-xs">
                  This template contains {selectedTemplate.milestone_count} milestone{selectedTemplate.milestone_count !== 1 ? 's' : ''}
                </div>
              </div>
            )}
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
              disabled={isApplying}
            >
              {t('action.cancel')}
            </Button>
            <Button type="submit" disabled={isApplying || !selectedTemplateId || templates.length === 0}>
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
