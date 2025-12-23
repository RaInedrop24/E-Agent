'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Shield,
  CheckCircle2,
  User,
  Calendar,
  FileText,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MilestoneTemplate {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
  creator_name?: string;
  milestone_count?: number;
  usage_count?: number;
  milestones?: Array<{
    label_en: string;
    label_it?: string;
    label_de?: string;
    label_fr?: string;
    label_es?: string;
    order_index: number;
  }>;
}

export default function MilestoneTemplatesPage() {
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const [templates, setTemplates] = useState<MilestoneTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MilestoneTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!superAdminLoading) {
      if (!isSuperAdmin) {
        window.location.href = '/dashboard';
      } else {
        fetchTemplates();
      }
    }
  }, [isSuperAdmin, superAdminLoading]);

  useEffect(() => {
    // Filter templates based on search query
    if (searchQuery.trim() === '') {
      setFilteredTemplates(templates);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = templates.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.creator_name?.toLowerCase().includes(query)
      );
      setFilteredTemplates(filtered);
    }
  }, [searchQuery, templates]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch templates from API endpoint
      const response = await fetch('/api/super-admin/templates');

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch templates');
      }

      const data = await response.json();
      console.log('Templates fetched successfully:', data.templates?.length || 0);
      setTemplates(data.templates || []);
      setFilteredTemplates(data.templates || []);
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  if (superAdminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading templates: {error}</p>
            <Button onClick={fetchTemplates} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                Milestone Templates
              </h1>
              <p className="text-muted-foreground mt-1">Manage milestone templates across all agents</p>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          Super Admin View
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Available in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + (t.milestone_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Usage</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Transactions using templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Templates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates List</CardTitle>
              <CardDescription>
                {filteredTemplates.length} of {templates.length} templates
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No templates found{searchQuery && ' matching your search'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border hover:border-green-300 transition-all"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => toggleExpanded(template.id)}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {template.name}
                        <Badge variant="outline" className="text-xs">
                          {template.milestone_count} milestone{template.milestone_count !== 1 ? 's' : ''}
                        </Badge>
                        {(template.usage_count || 0) > 0 && (
                          <Badge variant="default" className="text-xs">
                            Used in {template.usage_count} transaction{template.usage_count !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {template.creator_name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {new Date(template.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedTemplate === template.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded view showing milestones */}
                  {expandedTemplate === template.id && (
                    <div className="border-t p-4 bg-slate-50">
                      <h4 className="font-medium mb-3">Milestones in this template:</h4>
                      {template.milestones && template.milestones.length > 0 ? (
                        <div className="space-y-2">
                          {template.milestones
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((milestone, index) => (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 bg-white rounded border"
                              >
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-medium text-sm flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{milestone.label_en}</p>
                                  {(milestone.label_it || milestone.label_de || milestone.label_fr || milestone.label_es) && (
                                    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                      {milestone.label_it && <p>IT: {milestone.label_it}</p>}
                                      {milestone.label_de && <p>DE: {milestone.label_de}</p>}
                                      {milestone.label_fr && <p>FR: {milestone.label_fr}</p>}
                                      {milestone.label_es && <p>ES: {milestone.label_es}</p>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No milestones defined</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
