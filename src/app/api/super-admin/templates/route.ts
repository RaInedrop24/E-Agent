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
    console.log('[Templates API] Request received');

    // Verify super admin status
    const authCookie = request.cookies.get('sb-skvfgvlwccxetglmfhpm-auth-token')?.value;
    if (!authCookie) {
      console.log('[Templates API] No auth cookie found');
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

    console.log('[Templates API] Checking super admin status');
    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc('current_user_is_super_admin');

    if (rpcError) {
      console.error('[Templates API] RPC error:', rpcError);
      return NextResponse.json({ error: `RPC error: ${rpcError.message}` }, { status: 500 });
    }

    if (!isSuperAdmin) {
      console.log('[Templates API] User is not super admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[Templates API] User is super admin, fetching templates');

    // Fetch all milestone templates with creator info
    const { data: templatesData, error: templatesError } = await supabaseAdmin
      .from('milestone_templates')
      .select(`
        *,
        profiles!milestone_templates_created_by_fkey(id, full_name)
      `)
      .order('created_at', { ascending: false });

    if (templatesError) throw templatesError;

    // For each template, get milestone count and usage count
    const templatesWithDetails = await Promise.all(
      (templatesData || []).map(async (template: any) => {
        try {
          // Get milestones for this template
          const { data: milestonesData, count: milestoneCount } = await supabaseAdmin
            .from('milestone_template_items')
            .select('label_en, label_it, label_de, label_fr, label_es, order_index', { count: 'exact' })
            .eq('template_id', template.id)
            .order('order_index');

          // Count how many transactions use this template
          const { count: usageCount } = await supabaseAdmin
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('milestone_template_id', template.id);

          return {
            ...template,
            creator_name: template.profiles?.full_name || 'Unknown',
            milestone_count: milestoneCount || 0,
            usage_count: usageCount || 0,
            milestones: milestonesData || [],
          };
        } catch (err) {
          console.error(`Error fetching details for template ${template.id}:`, err);
          return {
            ...template,
            creator_name: template.profiles?.full_name || 'Unknown',
            milestone_count: 0,
            usage_count: 0,
            milestones: [],
          };
        }
      })
    );

    console.log('[Templates API] Returning', templatesWithDetails.length, 'templates');
    return NextResponse.json({
      templates: templatesWithDetails,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Templates API] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
