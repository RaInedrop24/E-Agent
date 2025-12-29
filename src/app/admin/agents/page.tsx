'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SendSystemMessageDialog } from '@/components/features/SendSystemMessageDialog';
import { 
  Loader2, 
  Shield, 
  UserCheck, 
  Mail, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  Search,
  CheckCircle2,
  ArrowRight,
  Globe,
  Bell,
} from 'lucide-react';

interface Agent {
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
  transaction_count?: number;
  active_transaction_count?: number;
  template_count?: number;
  last_activity?: string;
}

export default function AllAgentsPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (!superAdminLoading) {
      if (!isSuperAdmin) {
        router.push('/dashboard');
      } else {
        fetchAgents();
      }
    }
  }, [isSuperAdmin, superAdminLoading, router]);

  useEffect(() => {
    // Filter agents based on search query
    if (searchQuery.trim() === '') {
      setFilteredAgents(agents);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = agents.filter(agent =>
        agent.full_name.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query)
      );
      setFilteredAgents(filtered);
    }
  }, [searchQuery, agents]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session token
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Fetch agents from API endpoint
      const response = await fetch('/api/super-admin/agents', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch agents');
      }

      const data = await response.json();
      console.log('Agents fetched successfully:', data.agents?.length || 0);
      setAgents(data.agents || []);
      setFilteredAgents(data.agents || []);
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      setError(err.message);
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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading agents: {error}</p>
            <Button onClick={fetchAgents} className="mt-4">Retry</Button>
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
                <UserCheck className="h-8 w-8 text-blue-600" />
                All Agents
              </h1>
              <p className="text-muted-foreground mt-1">Registered agents in the system</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationDialogOpen(true)}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Send Notification
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmailDialogOpen(true)}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Shield className="h-3 w-3" />
            Super Admin View
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter(a => (a.active_transaction_count || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">With active transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, a) => sum + (a.transaction_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates Created</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, a) => sum + (a.template_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Milestone templates</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agents List</CardTitle>
              <CardDescription>
                {filteredAgents.length} of {agents.length} agents
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAgents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No agents found{searchQuery && ' matching your search'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map((agent) => (
                <Link key={agent.id} href={`/admin/agents/${agent.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-4 hover:border-blue-300 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar/Logo */}
                      <div className="relative">
                        {agent.branding_logo_url || agent.avatar_url ? (
                          <img
                            src={agent.branding_logo_url || agent.avatar_url || ''}
                            alt={agent.full_name}
                            className="w-12 h-12 rounded-full object-cover border-2"
                            style={{
                              borderColor: agent.branding_settings?.primary || '#3b82f6'
                            }}
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                            style={{
                              backgroundColor: agent.branding_settings?.primary || '#3b82f6'
                            }}
                          >
                            {agent.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Agent Info */}
                      <div className="space-y-1 flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {agent.full_name}
                          {(agent.active_transaction_count || 0) > 0 && (
                            <Badge variant="default" className="text-xs">
                              {agent.active_transaction_count} active
                            </Badge>
                          )}
                          {agent.branding_settings && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <span 
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: agent.branding_settings.primary || '#3b82f6' }}
                              />
                              Custom Branding
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {agent.email && (
                            <>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {agent.email}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {agent.preferred_language.toUpperCase()}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {agent.transaction_count || 0} transaction{agent.transaction_count !== 1 ? 's' : ''}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {agent.template_count || 0} template{agent.template_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Registered {new Date(agent.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Message Dialogs */}
      <SendSystemMessageDialog
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
        recipientType="agents"
        messageType="notification"
      />
      <SendSystemMessageDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        recipientType="agents"
        messageType="email"
      />
    </div>
  );
}

