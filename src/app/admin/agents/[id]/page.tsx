'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Shield, 
  ArrowLeft,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  Globe,
  Palette,
  Image as ImageIcon,
  Clock,
  Activity,
} from 'lucide-react';

interface AgentDetails {
  id: string;
  full_name: string;
  email?: string | null;
  preferred_language: string;
  avatar_url: string | null;
  branding_logo_url?: string | null;
  branding_settings?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
  } | null;
  created_at: string;
  updated_at: string;
  transaction_count: number;
  active_transaction_count: number;
  completed_transaction_count: number;
  template_count: number;
  recent_transactions: Array<{
    id: string;
    title_en: string;
    status: string;
    created_at: string;
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentDetailPage({ params }: PageProps) {
  const { id: agentId } = use(params);
  const router = useRouter();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!superAdminLoading) {
      if (!isSuperAdmin) {
        router.push('/dashboard');
      } else {
        fetchAgentDetails();
      }
    }
  }, [isSuperAdmin, superAdminLoading, agentId, router]);

  const fetchAgentDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) throw new Error('Supabase client not initialized');

      // Fetch agent profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agentId)
        .eq('role', 'agent')
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Agent not found');

      // Fetch email from auth.users
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(agentId);
      const email = authUser?.email || null;

      // Fetch transaction counts
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id, title_en, status, created_at')
        .eq('created_by', agentId)
        .order('created_at', { ascending: false });

      if (transError) throw transError;

      const transaction_count = transactions?.length || 0;
      const active_transaction_count = transactions?.filter((t: { status: string }) => t.status === 'active').length || 0;
      const completed_transaction_count = transactions?.filter((t: { status: string }) => t.status === 'completed').length || 0;
      const recent_transactions = transactions?.slice(0, 5) || [];

      // Fetch template count
      const { count: templateCount, error: templateError } = await supabase
        .from('milestone_templates')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      if (templateError) throw templateError;

      setAgent({
        ...profileData,
        email,
        transaction_count,
        active_transaction_count,
        completed_transaction_count,
        template_count: templateCount || 0,
        recent_transactions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (superAdminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading agent details: {error || 'Agent not found'}</p>
            <Button onClick={() => router.push('/admin/agents')} className="mt-4">
              Back to Agents
            </Button>
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
              <Link href="/admin/agents">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                Agent Profile
              </h1>
              <p className="text-muted-foreground mt-1">Detailed agent information and activity</p>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Shield className="h-3 w-3" />
          Super Admin View
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Information - Left Column */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {agent.branding_logo_url || agent.avatar_url ? (
                  <img
                    src={agent.branding_logo_url || agent.avatar_url || ''}
                    alt={agent.full_name}
                    className="w-24 h-24 rounded-full object-cover border-4"
                    style={{
                      borderColor: agent.branding_settings?.primary || '#3b82f6'
                    }}
                  />
                ) : (
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-3xl"
                    style={{
                      backgroundColor: agent.branding_settings?.primary || '#3b82f6'
                    }}
                  >
                    {agent.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl">{agent.full_name}</CardTitle>
              <CardDescription>Estate Agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {agent.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{agent.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>Preferred Language: {agent.preferred_language.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(agent.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Last updated {new Date(agent.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Branding Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {agent.branding_settings ? (
                <>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Color Scheme</div>
                    <div className="grid grid-cols-2 gap-2">
                      {agent.branding_settings.primary && (
                        <div className="space-y-1">
                          <div 
                            className="h-12 rounded border"
                            style={{ backgroundColor: agent.branding_settings.primary }}
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            Primary
                          </div>
                          <div className="text-xs text-center font-mono">
                            {agent.branding_settings.primary}
                          </div>
                        </div>
                      )}
                      {agent.branding_settings.secondary && (
                        <div className="space-y-1">
                          <div 
                            className="h-12 rounded border"
                            style={{ backgroundColor: agent.branding_settings.secondary }}
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            Secondary
                          </div>
                          <div className="text-xs text-center font-mono">
                            {agent.branding_settings.secondary}
                          </div>
                        </div>
                      )}
                      {agent.branding_settings.background && (
                        <div className="space-y-1">
                          <div 
                            className="h-12 rounded border"
                            style={{ backgroundColor: agent.branding_settings.background }}
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            Background
                          </div>
                          <div className="text-xs text-center font-mono">
                            {agent.branding_settings.background}
                          </div>
                        </div>
                      )}
                      {agent.branding_settings.text && (
                        <div className="space-y-1">
                          <div 
                            className="h-12 rounded border"
                            style={{ backgroundColor: agent.branding_settings.text }}
                          />
                          <div className="text-xs text-center text-muted-foreground">
                            Text
                          </div>
                          <div className="text-xs text-center font-mono">
                            {agent.branding_settings.text}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {agent.branding_logo_url && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Custom Logo
                      </div>
                      <div className="border rounded p-3 bg-slate-50 flex justify-center">
                        <img
                          src={agent.branding_logo_url}
                          alt="Agent Logo"
                          className="max-h-20 object-contain"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No custom branding configured
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity & Statistics - Right Column (spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agent.transaction_count}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agent.active_transaction_count}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates Created</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agent.template_count}</div>
                <p className="text-xs text-muted-foreground">Milestone templates</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Last 5 transactions created by this agent</CardDescription>
            </CardHeader>
            <CardContent>
              {agent.recent_transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agent.recent_transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{transaction.title_en}</div>
                        <div className="text-xs text-muted-foreground">
                          Created {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge
                        variant={
                          transaction.status === 'active' ? 'default' :
                          transaction.status === 'completed' ? 'secondary' :
                          'outline'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Statistics</CardTitle>
              <CardDescription>Overview of transaction statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Transactions</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500"
                        style={{ 
                          width: `${agent.transaction_count > 0 ? (agent.active_transaction_count / agent.transaction_count) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {agent.active_transaction_count}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed Transactions</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ 
                          width: `${agent.transaction_count > 0 ? (agent.completed_transaction_count / agent.transaction_count) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {agent.completed_transaction_count}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

