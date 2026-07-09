'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, GripVertical, Trash2, Plus, Save, Languages, Loader2 } from 'lucide-react';

interface TemplateItem {
  id: string;
  order_index: number;
  code: string;
  label_en: string;
  label_it: string | null;
  label_de: string | null;
  label_fr: string | null;
  label_es: string | null;
  label_pl: string | null;
}

interface Template {
  id: string;
  template_name: string;
  description: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditTemplatePage({ params }: PageProps) {
  const { id: templateId } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const [template, setTemplate] = useState<Template | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (profile?.role !== 'agent') {
      router.push('/dashboard');
      return;
    }
    fetchTemplate();
  }, [user, profile, templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      if (!supabase) return;

      // Fetch template metadata
      const { data: templateData, error: templateError } = await supabase
        .from('milestone_templates')
        .select('id, template_name, description')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;
      if (!templateData) throw new Error('Template not found');

      setTemplate(templateData);

      // Fetch template items using RPC function
      const { data: itemsData, error: itemsError } = await supabase.rpc(
        'get_milestone_template_items',
        { p_template_id: templateId }
      );

      if (itemsError) throw itemsError;

      setItems(itemsData || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem: TemplateItem = {
      id: `new-${Date.now()}`,
      order_index: items.length,
      code: `CUSTOM_${Date.now()}`,
      label_en: 'New Milestone',
      label_it: null,
      label_de: null,
      label_fr: null,
      label_es: null,
      label_pl: null,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleDeleteItem = (index: number) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      const updated = items.filter((_, i) => i !== index);
      // Reorder indices
      updated.forEach((item, i) => {
        item.order_index = i;
      });
      setItems(updated);
    }
  };

  const handleTranslateItem = async (index: number) => {
    try {
      setTranslatingIndex(index);
      setTranslationError(null);

      const item = items[index];

      // Get the source label based on user's preferred language
      const sourceLabelField = `label_${language}` as keyof TemplateItem;
      const sourceText = item[sourceLabelField];

      // Validate source text exists
      if (!sourceText || (typeof sourceText === 'string' && sourceText.trim() === '')) {
        throw new Error(`Please enter a label in your language (${language.toUpperCase()}) before translating`);
      }

      // Get all target languages (all languages except the source)
      const allLanguages: Array<'en' | 'it' | 'de' | 'fr' | 'es' | 'pl'> = ['en', 'it', 'de', 'fr', 'es', 'pl'];
      const targetLangs = allLanguages.filter(lang => lang !== language);

      // Translate to all target languages in parallel
      const translationPromises = targetLangs.map(async (targetLang) => {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: sourceText,
            targetLang: targetLang,
            sourceLang: language
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Translation to ${targetLang.toUpperCase()} failed: ${errorData.error || response.statusText}`);
        }

        const result = await response.json();
        return { lang: targetLang, text: result.translatedText };
      });

      const results = await Promise.all(translationPromises);

      // Update item with translations
      const updated = [...items];
      results.forEach(({ lang, text }) => {
        const field = `label_${lang}` as keyof TemplateItem;
        updated[index] = {
          ...updated[index],
          [field]: text
        };
      });
      setItems(updated);

    } catch (err) {
      setTranslationError(err instanceof Error ? err.message : 'Translation failed. Please try again.');
    } finally {
      setTranslatingIndex(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...items];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    // Update order indices
    updated.forEach((item, i) => {
      item.order_index = i;
    });

    setItems(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!supabase || !template) return;

      // Update template metadata
      const { error: updateError } = await supabase
        .from('milestone_templates')
        .update({
          template_name: template.template_name,
          description: template.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (updateError) throw updateError;

      // Delete removed items
      const existingIds = items
        .filter(item => !item.id.startsWith('new-'))
        .map(item => item.id);

      // Get all current item IDs from database
      const { data: currentItems } = await supabase
        .from('milestone_template_items')
        .select('id')
        .eq('template_id', templateId);

      if (currentItems) {
        const toDelete = currentItems
          .filter((item: { id: string }) => !existingIds.includes(item.id))
          .map((item: { id: string }) => item.id);

        if (toDelete.length > 0) {
          await supabase
            .from('milestone_template_items')
            .delete()
            .in('id', toDelete);
        }
      }

      // Update or insert items
      for (const item of items) {
        if (item.id.startsWith('new-')) {
          // Insert new item
          const { error } = await supabase
            .from('milestone_template_items')
            .insert({
              template_id: templateId,
              order_index: item.order_index,
              code: item.code,
              label_en: item.label_en,
              label_it: item.label_it,
              label_de: item.label_de,
              label_fr: item.label_fr,
              label_es: item.label_es,
              label_pl: item.label_pl,
            });

          if (error) throw error;
        } else {
          // Update existing item
          const { error } = await supabase
            .from('milestone_template_items')
            .update({
              order_index: item.order_index,
              label_en: item.label_en,
              label_it: item.label_it,
              label_de: item.label_de,
              label_fr: item.label_fr,
              label_es: item.label_es,
              label_pl: item.label_pl,
              code: item.code,
            })
            .eq('id', item.id);

          if (error) throw error;
        }
      }

      // Redirect back to templates list
      router.push('/milestone-templates');
    } catch (err) {
      alert('Failed to save template: ' + (err instanceof Error ? err.message : String(err)));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-muted-foreground">Loading template...</div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || 'Template not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/milestone-templates">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/milestone-templates">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Template</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template_name">
              Template Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="template_name"
              value={template.template_name}
              onChange={(e) => setTemplate({ ...template, template_name: e.target.value })}
              disabled={saving}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              value={template.description || ''}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              disabled={saving}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <p className="font-semibold">Instructions:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Drag and drop milestones to reorder them</li>
              <li>Click &quot;Add Milestone&quot; to create new steps</li>
              <li>Edit milestone labels in different languages</li>
              <li>Click &quot;Translate&quot; to auto-translate to other languages</li>
              <li>Delete unwanted milestones using the trash icon</li>
              <li>Click &quot;Save Changes&quot; when finished</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Translation Error Banner */}
      {translationError && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-red-800 text-sm">{translationError}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTranslationError(null)}
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones ({items.length})</CardTitle>
          <CardDescription>
            Define the steps included in this template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No milestones yet. Add your first milestone to get started.
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`border rounded-lg p-4 space-y-3 transition-colors ${
                  draggedIndex === index ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="cursor-move">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 font-semibold">
                    Step {index + 1}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslateItem(index)}
                    disabled={saving || translatingIndex !== null}
                  >
                    {translatingIndex === index ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Languages className="mr-2 h-4 w-4" />
                        Translate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(index)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 pl-8">
                  <div className="space-y-1">
                    <Label htmlFor={`label_en_${index}`}>English Label *</Label>
                    <Input
                      id={`label_en_${index}`}
                      value={item.label_en}
                      onChange={(e) => handleUpdateItem(index, 'label_en', e.target.value)}
                      placeholder="e.g., Offer Accepted"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_it_${index}`}>Italian Label</Label>
                    <Input
                      id={`label_it_${index}`}
                      value={item.label_it || ''}
                      onChange={(e) => handleUpdateItem(index, 'label_it', e.target.value)}
                      placeholder="e.g., Offerta Accettata"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_de_${index}`}>German Label</Label>
                    <Input
                      id={`label_de_${index}`}
                      value={item.label_de || ''}
                      onChange={(e) => handleUpdateItem(index, 'label_de', e.target.value)}
                      placeholder="e.g., Angebot Angenommen"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_fr_${index}`}>French Label</Label>
                    <Input
                      id={`label_fr_${index}`}
                      value={item.label_fr || ''}
                      onChange={(e) => handleUpdateItem(index, 'label_fr', e.target.value)}
                      placeholder="e.g., Offre Acceptée"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_es_${index}`}>Spanish Label</Label>
                    <Input
                      id={`label_es_${index}`}
                      value={item.label_es || ''}
                      onChange={(e) => handleUpdateItem(index, 'label_es', e.target.value)}
                      placeholder="e.g., Oferta Aceptada"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_pl_${index}`}>Polish Label</Label>
                    <Input
                      id={`label_pl_${index}`}
                      value={item.label_pl || ''}
                      onChange={(e) => handleUpdateItem(index, 'label_pl', e.target.value)}
                      placeholder="e.g., Oferta Zaakceptowana"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          <Button onClick={handleAddItem} variant="outline" className="w-full" disabled={saving}>
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </CardContent>
      </Card>

      {/* Save Button at Bottom */}
      <div className="flex justify-end gap-3">
        <Link href="/milestone-templates">
          <Button variant="outline" disabled={saving}>
            Cancel
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
