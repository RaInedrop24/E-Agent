import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

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
    console.log('[Buyers API] Request received');

    // Verify super admin status
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!authCookie) {
      console.log('[Buyers API] No auth cookie found');
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

    console.log('[Buyers API] Checking super admin status');
    const { data: isSuperAdmin, error: rpcError } = await supabase.rpc('current_user_is_super_admin');

    if (rpcError) {
      console.error('[Buyers API] RPC error:', rpcError);
      return NextResponse.json({ error: `RPC error: ${rpcError.message}` }, { status: 500 });
    }

    if (!isSuperAdmin) {
      console.log('[Buyers API] User is not super admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[Buyers API] User is super admin, fetching buyers');

    // Fetch all buyers
    const { data: buyersData, error: buyersError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('role', 'buyer')
      .order('created_at', { ascending: false });

    if (buyersError) throw buyersError;

    // Get email addresses and additional data for each buyer
    const buyersWithDetails = await Promise.all(
      (buyersData || []).map(async (buyer) => {
        try {
          // Get email from auth.users
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(buyer.id);

          // Get transaction count for this buyer
          const { count: txCount } = await supabaseAdmin
            .from('transaction_participants')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', buyer.id);

          // Get last activity (most recent message)
          const { data: lastMessage } = await supabaseAdmin
            .from('messages')
            .select('created_at')
            .eq('sender_id', buyer.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...buyer,
            email: userData?.user?.email || 'N/A',
            transaction_count: txCount || 0,
            last_activity: lastMessage?.created_at || buyer.created_at,
          };
        } catch (err) {
          console.error(`Error fetching details for buyer ${buyer.id}:`, err);
          return {
            ...buyer,
            email: 'N/A',
            transaction_count: 0,
            last_activity: buyer.created_at,
          };
        }
      })
    );

    console.log('[Buyers API] Returning', buyersWithDetails.length, 'buyers');
    return NextResponse.json({
      buyers: buyersWithDetails,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Buyers API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
