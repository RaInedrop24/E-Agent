'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_MILESTONES } from '@/lib/defaultMilestones';

interface CreateMilestoneTemplateModalProps {
  onSuccess?: () => void;
}

export function CreateMilestoneTemplateModal({ onSuccess }: CreateMilestoneTemplateModalProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Call the RPC function with default milestones
      const { data, error: rpcError } = await supabase.rpc('save_milestone_template', {
        p_template_name: templateName.trim(),
        p_description: description.trim() || null,
        p_milestones: DEFAULT_MILESTONES,
      });

      if (rpcError) throw rpcError;

      // Check if the RPC function returned an error
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to create template');
      }

      // Success - redirect to edit page
      const templateId = data?.template_id;
      if (templateId) {
        router.push(`/milestone-templates/${templateId}`);
      } else {
        // Fallback: close modal and refresh list
        setOpen(false);
        setTemplateName('');
        setDescription('');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create template');
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Create a template with default milestones. You'll be able to customize them immediately after.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate}>
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
                This template will include {DEFAULT_MILESTONES.length} default milestones
              </div>
            </div>

            {/* Info Message */}
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>You'll be taken to the edit page to customize the milestones</span>
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
              Create Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
