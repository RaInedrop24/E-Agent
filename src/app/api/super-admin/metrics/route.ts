import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    // Verify super admin status
    const authCookie = request.cookies.get('sb-skvfgvlwccxetglmfhpm-auth-token')?.value;
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authData = JSON.parse(authCookie);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.setSession({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
    });

    const { data: isSuperAdmin } = await supabase.rpc('current_user_is_super_admin');
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all metrics in parallel
    const [
      usersResult,
      transactionsResult,
      milestonesResult,
      messagesResult,
      filesResult,
      buyersResult,
      templatesResult,
      recentActivityResult,
    ] = await Promise.all([
      // Users metrics
      supabaseAdmin.from('profiles').select('id, role, created_at, is_super_admin'),

      // Transactions metrics
      supabaseAdmin.from('transactions').select('id, status, created_at, created_by'),

      // Milestones metrics
      supabaseAdmin.from('milestones').select('id, completed, transaction_id'),

      // Messages metrics
      supabaseAdmin.from('messages').select('id, created_at'),

      // Files metrics with size
      supabaseAdmin.from('files').select('id, file_size, created_at'),

      // Buyers
      supabaseAdmin.from('profiles').select('id, full_name, email, created_at').eq('role', 'buyer'),

      // Milestone templates
      supabaseAdmin.from('milestone_templates').select('id, name, created_by'),

      // Recent activity (last 30 days)
      supabaseAdmin
        .from('milestones')
        .select('completed_at')
        .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .not('completed_at', 'is', null),
    ]);

    // Calculate storage usage
    const totalStorageBytes = filesResult.data?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
    const totalStorageGB = totalStorageBytes / (1024 * 1024 * 1024);

    // Process users
    const users = usersResult.data || [];
    const agents = users.filter(u => u.role === 'agent');
    const buyers = buyersResult.data || [];
    const superAdmins = users.filter(u => u.is_super_admin);

    // Active users (created in last 30 days or have recent activity)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeAgents = agents.filter(a => new Date(a.created_at) > thirtyDaysAgo);

    // Process transactions
    const transactions = transactionsResult.data || [];
    const activeTransactions = transactions.filter(t => t.status === 'active');
    const completedTransactions = transactions.filter(t => t.status === 'completed');

    // Transactions per agent
    const transactionsByAgent = transactions.reduce((acc: any, t) => {
      acc[t.created_by] = (acc[t.created_by] || 0) + 1;
      return acc;
    }, {});

    const topAgents = Object.entries(transactionsByAgent)
      .map(([agentId, count]) => ({
        agentId,
        count,
        agent: users.find(u => u.id === agentId),
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Process milestones
    const milestones = milestonesResult.data || [];
    const completedMilestones = milestones.filter(m => m.completed);
    const completionRate = milestones.length > 0
      ? (completedMilestones.length / milestones.length) * 100
      : 0;

    // Activity trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const activityByDay = last7Days.map(day => {
      const dayActivity = recentActivityResult.data?.filter(a =>
        a.completed_at?.startsWith(day)
      ).length || 0;

      return {
        date: day,
        count: dayActivity,
      };
    });

    // Supabase Pro Limits
    const supabaseLimits = {
      database: {
        size: { used: 0, limit: 8, unit: 'GB', percentage: 0 }, // Pro: 8GB
        connections: { used: 0, limit: 200, unit: 'connections' }, // Can't easily measure without direct pg access
      },
      storage: {
        size: {
          used: Number(totalStorageGB.toFixed(2)),
          limit: 100,
          unit: 'GB',
          percentage: Number((totalStorageGB / 100 * 100).toFixed(2))
        }, // Pro: 100GB
      },
      bandwidth: {
        egress: { used: 0, limit: 250, unit: 'GB/month' }, // Pro: 250GB
      },
      auth: {
        mau: {
          used: users.length,
          limit: 100000,
          unit: 'MAU',
          percentage: Number((users.length / 100000 * 100).toFixed(2))
        }, // Pro: 100k MAU
      },
    };

    return NextResponse.json({
      overview: {
        totalUsers: users.length,
        totalAgents: agents.length,
        totalBuyers: buyers.length,
        superAdmins: superAdmins.length,
        activeAgents: activeAgents.length,
        totalTransactions: transactions.length,
        activeTransactions: activeTransactions.length,
        completedTransactions: completedTransactions.length,
        totalMilestones: milestones.length,
        completedMilestones: completedMilestones.length,
        completionRate: Number(completionRate.toFixed(1)),
        totalMessages: messagesResult.data?.length || 0,
        totalFiles: filesResult.data?.length || 0,
        storageUsedGB: Number(totalStorageGB.toFixed(2)),
        totalTemplates: templatesResult.data?.length || 0,
      },
      topAgents,
      activityTrends: activityByDay,
      supabaseLimits,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Super Admin Metrics] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
