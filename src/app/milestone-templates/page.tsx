'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Edit, Trash2, FileText } from 'lucide-react';
import { CreateMilestoneTemplateModal } from '@/components/features/transaction/CreateMilestoneTemplateModal';

interface MilestoneTemplate {
  id: string;
  template_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  milestone_count: number;
}

export default function MilestoneTemplatesPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (profile?.role !== 'agent') {
      router.push('/dashboard');
      return;
    }
    fetchTemplates();
  }, [user, profile]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      if (!supabase) return;

      // Call RPC function to get templates
      const { data, error: rpcError } = await supabase.rpc('get_milestone_templates');

      if (rpcError) throw rpcError;

      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(templateId);
      if (!supabase) return;

      // Call RPC function to delete template
      const { data, error: rpcError } = await supabase.rpc('delete_milestone_template', {
        p_template_id: templateId,
      });

      if (rpcError) throw rpcError;

      // Check if the RPC function returned an error
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to delete template');
      }

      // Success - refresh the list
      await fetchTemplates();
    } catch (err) {
      alert(`Failed to delete template: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user || profile?.role !== 'agent') {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Milestone Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Reusable milestone configurations for your transactions
          </p>
        </div>
        <CreateMilestoneTemplateModal onSuccess={fetchTemplates} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>
            {templates.length === 0
              ? 'No templates yet. Click "Create New Template" above to get started.'
              : `You have ${templates.length} saved template${templates.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-red-500 py-4">Error: {error}</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-muted p-6">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">No templates yet</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Create your first template by clicking &quot;Create New Template&quot; above,
                  or save milestones from any transaction&apos;s milestones page.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="truncate">{template.template_name}</span>
                      <span className="text-sm font-normal text-muted-foreground ml-2 whitespace-nowrap">
                        {template.milestone_count} step{template.milestone_count !== 1 ? 's' : ''}
                      </span>
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Updated {new Date(template.updated_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/milestone-templates/${template.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id, template.template_name)}
                          disabled={deletingId === template.id}
                        >
                          {deletingId === template.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
