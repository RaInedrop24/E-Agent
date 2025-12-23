'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Users,
  FileText,
  Activity,
  Database,
  HardDrive,
  Wifi,
  UserCheck,
  TrendingUp,
  Settings,
  TestTube,
  MessageSquare,
  FolderOpen,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Metrics {
  overview: {
    totalUsers: number;
    totalAgents: number;
    totalBuyers: number;
    superAdmins: number;
    activeAgents: number;
    totalTransactions: number;
    activeTransactions: number;
    completedTransactions: number;
    totalMilestones: number;
    completedMilestones: number;
    completionRate: number;
    totalMessages: number;
    totalFiles: number;
    storageUsedGB: number;
    totalTemplates: number;
  };
  topAgents: Array<{
    agentId: string;
    count: number;
    agent: any;
  }>;
  activityTrends: Array<{
    date: string;
    count: number;
  }>;
  supabaseLimits: {
    database: {
      size: { used: number; limit: number; unit: string; percentage: number };
      connections: { used: number; limit: number; unit: string };
    };
    storage: {
      size: { used: number; limit: number; unit: string; percentage: number };
    };
    bandwidth: {
      egress: { used: number; limit: number; unit: string };
    };
    auth: {
      mau: { used: number; limit: number; unit: string; percentage: number };
    };
  };
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading metrics: {error}</p>
            <Button onClick={fetchMetrics} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, topAgents, activityTrends, supabaseLimits } = metrics;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">System health monitoring and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMetrics}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/admin">
              <Settings className="h-4 w-4 mr-2" />
              Admin Tools
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {overview.totalAgents} agents • {overview.totalBuyers} buyers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeTransactions} active • {overview.completedTransactions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {overview.completedMilestones} / {overview.totalMilestones} milestones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.storageUsedGB} GB</div>
            <p className="text-xs text-muted-foreground">
              {overview.totalFiles} files uploaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supabase Pro Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Pro Plan Limits
          </CardTitle>
          <CardDescription>Monitor resource usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage
              </span>
              <span className="text-muted-foreground">
                {supabaseLimits.storage.size.used} / {supabaseLimits.storage.size.limit} {supabaseLimits.storage.size.unit}
              </span>
            </div>
            <Progress value={supabaseLimits.storage.size.percentage} />
            <p className="text-xs text-muted-foreground">
              {supabaseLimits.storage.size.percentage}% used
            </p>
          </div>

          {/* Auth MAU */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Monthly Active Users
              </span>
              <span className="text-muted-foreground">
                {supabaseLimits.auth.mau.used.toLocaleString()} / {supabaseLimits.auth.mau.limit.toLocaleString()} {supabaseLimits.auth.mau.unit}
              </span>
            </div>
            <Progress value={supabaseLimits.auth.mau.percentage} />
            <p className="text-xs text-muted-foreground">
              {supabaseLimits.auth.mau.percentage}% used
            </p>
          </div>

          {/* Bandwidth */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Bandwidth (Egress)
              </span>
              <span className="text-muted-foreground">
                {supabaseLimits.bandwidth.egress.used} / {supabaseLimits.bandwidth.egress.limit} {supabaseLimits.bandwidth.egress.unit}
              </span>
            </div>
            <Progress value={0} />
            <p className="text-xs text-muted-foreground">
              Monitoring not available (requires Supabase dashboard)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Activity & Engagement */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Agents by Transactions
            </CardTitle>
            <CardDescription>Agents with most transactions created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAgents.slice(0, 5).map((agent, index) => (
                <div key={agent.agentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{agent.agent?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{agent.count} transactions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${(agent.count / topAgents[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Last 7 Days
            </CardTitle>
            <CardDescription>Milestone completions per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityTrends.map((day, index) => {
                const maxCount = Math.max(...activityTrends.map(d => d.count), 1);
                const percentage = (day.count / maxCount) * 100;
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs w-20 text-muted-foreground">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-6 bg-gray-200 rounded overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-blue-300 transition-colors cursor-pointer">
          <Link href="/transactions">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">View All Transactions</p>
                  <p className="text-xs text-muted-foreground">Browse and filter</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-purple-300 transition-colors cursor-pointer">
          <Link href="/admin/buyers">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">All Buyers</p>
                  <p className="text-xs text-muted-foreground">{overview.totalBuyers} total</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-green-300 transition-colors cursor-pointer">
          <Link href="/admin/milestone-templates">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Milestone Templates</p>
                  <p className="text-xs text-muted-foreground">{overview.totalTemplates} templates</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-orange-300 transition-colors cursor-pointer">
          <Link href="/admin">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Admin Tools</p>
                  <p className="text-xs text-muted-foreground">Debug & test</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-sm text-muted-foreground">{supabaseLimits.storage.size.percentage}% used</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">Authentication</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
