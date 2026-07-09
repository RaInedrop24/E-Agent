'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, GripVertical, Trash2, Plus, Save, Languages, Loader2 } from 'lucide-react';
import { SaveMilestoneTemplateModal } from '@/components/features/transaction/SaveMilestoneTemplateModal';
import { ApplyMilestoneTemplateModal } from '@/components/features/transaction/ApplyMilestoneTemplateModal';

interface Milestone {
  id: string;
  transaction_id: string;
  order_index: number;
  code: string;
  label_en: string;
  label_it: string | null;
  label_de: string | null;
  label_fr: string | null;
  label_es: string | null;
  label_pl: string | null;
  completed: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MilestonePage({ params }: PageProps) {
  const { id: transactionId } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [transactionTitle, setTransactionTitle] = useState('');
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
    // Wait for super admin check to complete
    if (superAdminLoading) {
      return;
    }
    if (profile?.role !== 'agent' && !isSuperAdmin) {
      router.push(`/transaction/${transactionId}`);
      return;
    }
    fetchMilestones();
  }, [user, profile, transactionId, isSuperAdmin, superAdminLoading]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      if (!supabase) return;

      // Fetch transaction
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('id, title, created_by')
        .eq('id', transactionId)
        .single();

      if (txError) throw txError;
      if (!txData) throw new Error('Transaction not found');

      // Check if user is creator or participant or super admin
      const isCreator = txData.created_by === user?.id;

      if (!isCreator && !isSuperAdmin) {
        const { data: participantCheck } = await supabase
          .from('transaction_participants')
          .select('id')
          .eq('transaction_id', transactionId)
          .eq('profile_id', user?.id)
          .eq('participant_role', 'agent')
          .maybeSingle();

        if (!participantCheck) {
          setError('Access denied');
          setLoading(false);
          return;
        }
      }

      setTransactionTitle(txData.title);

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('order_index', { ascending: true });

      if (milestonesError) throw milestonesError;

      setMilestones(milestonesData || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: `new-${Date.now()}`,
      transaction_id: transactionId,
      order_index: milestones.length,
      code: `CUSTOM_${Date.now()}`,
      label_en: 'New Milestone',
      label_it: null,
      label_de: null,
      label_fr: null,
      label_es: null,
      label_pl: null,
      completed: false,
    };
    setMilestones([...milestones, newMilestone]);
  };

  const handleUpdateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleDeleteMilestone = (index: number) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      const updated = milestones.filter((_, i) => i !== index);
      // Reorder indices
      updated.forEach((m, i) => {
        m.order_index = i;
      });
      setMilestones(updated);
    }
  };

  const handleTranslateMilestone = async (index: number) => {
    try {
      setTranslatingIndex(index);
      setTranslationError(null);

      const milestone = milestones[index];

      // Get the source label based on user's preferred language
      const sourceLabelField = `label_${language}` as keyof Milestone;
      const sourceText = milestone[sourceLabelField];

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

      // Update milestone with translations
      const updated = [...milestones];
      results.forEach(({ lang, text }) => {
        const field = `label_${lang}` as keyof Milestone;
        updated[index] = {
          ...updated[index],
          [field]: text
        };
      });
      setMilestones(updated);

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

    const updated = [...milestones];
    const draggedItem = updated[draggedIndex];
    updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);

    // Update order indices
    updated.forEach((m, i) => {
      m.order_index = i;
    });

    setMilestones(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!supabase) return;

      // Delete removed milestones
      const existingIds = milestones
        .filter(m => !m.id.startsWith('new-'))
        .map(m => m.id);

      // Get all current milestone IDs from database
      const { data: currentMilestones } = await supabase
        .from('milestones')
        .select('id')
        .eq('transaction_id', transactionId);

      if (currentMilestones) {
        const toDelete = currentMilestones
          .filter((m: { id: string }) => !existingIds.includes(m.id))
          .map((m: { id: string }) => m.id);

        if (toDelete.length > 0) {
          await supabase
            .from('milestones')
            .delete()
            .in('id', toDelete);
        }
      }

      // Update or insert milestones
      for (const milestone of milestones) {
        if (milestone.id.startsWith('new-')) {
          // Insert new milestone
          const { error } = await supabase
            .from('milestones')
            .insert({
              transaction_id: transactionId,
              order_index: milestone.order_index,
              code: milestone.code,
              label_en: milestone.label_en,
              label_it: milestone.label_it,
              label_de: milestone.label_de,
              label_fr: milestone.label_fr,
              label_es: milestone.label_es,
              completed: false,
            });

          if (error) throw error;
        } else {
          // Update existing milestone
          const { error } = await supabase
            .from('milestones')
            .update({
              order_index: milestone.order_index,
              label_en: milestone.label_en,
              label_it: milestone.label_it,
              label_de: milestone.label_de,
              label_fr: milestone.label_fr,
              label_es: milestone.label_es,
            })
            .eq('id', milestone.id);

          if (error) throw error;
        }
      }

      // Redirect back to transaction
      router.push(`/transaction/${transactionId}`);
    } catch (err) {
      alert('Failed to save milestones: ' + (err instanceof Error ? err.message : String(err)));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-muted-foreground">Loading milestones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/transaction/${transactionId}`}>
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Transaction
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
        <Link href={`/transaction/${transactionId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Manage Milestones</h1>
          <p className="text-muted-foreground mt-1">{transactionTitle}</p>
        </div>
        <ApplyMilestoneTemplateModal
          transactionId={transactionId}
          onSuccess={() => {
            alert('Template applied successfully! The page will reload.');
            fetchMilestones();
          }}
        />
        <SaveMilestoneTemplateModal
          milestones={milestones.map(m => ({
            code: m.code,
            label_en: m.label_en,
            label_it: m.label_it,
            label_de: m.label_de,
            label_fr: m.label_fr,
            label_es: m.label_es,
          }))}
          onSuccess={() => {
            alert('Template saved successfully! You can find it in the Milestone Templates menu.');
          }}
        />
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

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
          <CardTitle>Milestones ({milestones.length})</CardTitle>
          <CardDescription>
            Customize the steps for this property transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No milestones yet. Add your first milestone to get started.
            </div>
          ) : (
            milestones.map((milestone, index) => (
              <div
                key={milestone.id}
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
                    {milestone.completed && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslateMilestone(index)}
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
                    onClick={() => handleDeleteMilestone(index)}
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
                      value={milestone.label_en}
                      onChange={(e) => handleUpdateMilestone(index, 'label_en', e.target.value)}
                      placeholder="e.g., Offer Accepted"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_it_${index}`}>Italian Label</Label>
                    <Input
                      id={`label_it_${index}`}
                      value={milestone.label_it || ''}
                      onChange={(e) => handleUpdateMilestone(index, 'label_it', e.target.value)}
                      placeholder="e.g., Offerta Accettata"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_de_${index}`}>German Label</Label>
                    <Input
                      id={`label_de_${index}`}
                      value={milestone.label_de || ''}
                      onChange={(e) => handleUpdateMilestone(index, 'label_de', e.target.value)}
                      placeholder="e.g., Angebot Angenommen"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_fr_${index}`}>French Label</Label>
                    <Input
                      id={`label_fr_${index}`}
                      value={milestone.label_fr || ''}
                      onChange={(e) => handleUpdateMilestone(index, 'label_fr', e.target.value)}
                      placeholder="e.g., Offre Acceptée"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_es_${index}`}>Spanish Label</Label>
                    <Input
                      id={`label_es_${index}`}
                      value={milestone.label_es || ''}
                      onChange={(e) => handleUpdateMilestone(index, 'label_es', e.target.value)}
                      placeholder="e.g., Oferta Aceptada"
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`label_pl_${index}`}>Polish Label</Label>
                    <Input
                      id={`label_pl_${index}`}
                      value={milestone.label_pl || ''}
                      onChange={(e) => handleUpdateMilestone(index, 'label_pl', e.target.value)}
                      placeholder="e.g., Oferta Zaakceptowana"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            ))
          )}

          <Button onClick={handleAddMilestone} variant="outline" className="w-full" disabled={saving}>
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </CardContent>
      </Card>

      {/* Save Button at Bottom */}
      <div className="flex justify-end gap-3">
        <Link href={`/transaction/${transactionId}`}>
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
