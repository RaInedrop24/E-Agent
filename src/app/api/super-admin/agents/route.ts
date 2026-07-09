import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
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
    // Verify user is super admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Fetch all agents with their details
    const { data: agentsData, error: agentsError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, preferred_language, avatar_url, branding_logo_url, branding_settings, created_at, updated_at')
      .eq('role', 'agent')
      .order('created_at', { ascending: false });

    if (agentsError) throw agentsError;

    // Row shapes match the .select() strings on each query below
    interface AgentRow {
      id: string;
      full_name: string | null;
      preferred_language: string | null;
      avatar_url: string | null;
      branding_logo_url: string | null;
      branding_settings: unknown;
      created_at: string;
      updated_at: string;
    }

    // Get emails from auth.users for each agent
    const agentIds = (agentsData || []).map((agent: AgentRow) => agent.id);
    const { data: authUsers } = await supabaseAdmin
      .from('auth.users')
      .select('id, email')
      .in('id', agentIds);

    // Create email lookup map
    const emailMap = new Map((authUsers || []).map((u: { id: string; email: string | null }) => [u.id, u.email]));

    // Fetch transaction counts for each agent
    const { data: transactionCounts } = await supabaseAdmin
      .from('transactions')
      .select('created_by, id')
      .in('created_by', agentIds);

    // Create transaction count map
    const countMap = new Map<string, number>();
    (transactionCounts || []).forEach((t: { created_by: string; id: string }) => {
      countMap.set(t.created_by, (countMap.get(t.created_by) || 0) + 1);
    });

    // Fetch active transaction counts
    const { data: activeTransactions } = await supabaseAdmin
      .from('transactions')
      .select('created_by, id')
      .eq('status', 'active')
      .in('created_by', agentIds);

    const activeCountMap = new Map<string, number>();
    (activeTransactions || []).forEach((t: { created_by: string; id: string }) => {
      activeCountMap.set(t.created_by, (activeCountMap.get(t.created_by) || 0) + 1);
    });

    // Fetch template counts for each agent
    const { data: templateCounts } = await supabaseAdmin
      .from('milestone_templates')
      .select('agent_id, id')
      .in('agent_id', agentIds);

    const templateCountMap = new Map<string, number>();
    (templateCounts || []).forEach((t: { agent_id: string; id: string }) => {
      templateCountMap.set(t.agent_id, (templateCountMap.get(t.agent_id) || 0) + 1);
    });

    // Combine all data
    const agents = (agentsData || []).map((agent: AgentRow) => ({
      ...agent,
      email: emailMap.get(agent.id) || null,
      transaction_count: countMap.get(agent.id) || 0,
      active_transaction_count: activeCountMap.get(agent.id) || 0,
      template_count: templateCountMap.get(agent.id) || 0,
      last_activity: agent.updated_at,
    }));

    return NextResponse.json({
      agents,
      total: agents.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Agents API] Error:', error);
    return NextResponse.json({
      error: (error instanceof Error ? error.message : '') || 'Failed to fetch agents',
    }, { status: 500 });
  }
}

