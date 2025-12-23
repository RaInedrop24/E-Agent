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
    // Get user from cookie
    const authCookie = request.cookies.get('sb-skvfgvlwccxetglmfhpm-auth-token')?.value;

    if (!authCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const authData = JSON.parse(authCookie);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    await supabase.auth.setSession({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check super admin status using RPC
    const { data: isSuperAdminRPC, error: rpcError } = await supabase.rpc('current_user_is_super_admin');

    // Check using auth function
    const { data: isSuperAdminAuth, error: authError } = await supabase.rpc('auth_user_is_super_admin');

    // Get profile directly with admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, is_super_admin, role')
      .eq('id', user.id)
      .single();

    // Try to get all transactions with admin client
    const { data: allTransactionsAdmin, error: allTransactionsAdminError } = await supabaseAdmin
      .from('transactions')
      .select('id, title, created_by')
      .limit(10);

    // Try to get transactions with user client
    const { data: allTransactionsUser, error: allTransactionsUserError } = await supabase
      .from('transactions')
      .select('id, title, created_by')
      .limit(10);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile,
      profileError: profileError?.message,
      isSuperAdminRPC: isSuperAdminRPC,
      rpcError: rpcError?.message,
      isSuperAdminAuth: isSuperAdminAuth,
      authError: authError?.message,
      transactionsWithAdmin: {
        count: allTransactionsAdmin?.length || 0,
        data: allTransactionsAdmin,
        error: allTransactionsAdminError?.message,
      },
      transactionsWithUser: {
        count: allTransactionsUser?.length || 0,
        data: allTransactionsUser,
        error: allTransactionsUserError?.message,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
