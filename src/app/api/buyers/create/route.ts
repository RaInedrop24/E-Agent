import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create admin client with service role key (server-side only)
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

export async function POST(request: NextRequest) {
  try {
    // Get the current user's session from the request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create client to verify the requesting user
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Verify the user is authenticated and is an agent
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is an agent using admin client (bypasses RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'agent') {
      return NextResponse.json(
        { error: 'Only agents can create buyers' },
        { status: 403 }
      );
    }

    // Parse request body
    const { email, fullName, preferredLanguage } = await request.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    // Create and invite the buyer user using admin API
    // Using inviteUserByEmail sends an invitation email automatically
    console.log('[Buyer Creation] Step 1: Inviting user via email', { email, fullName, preferredLanguage });
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          full_name: fullName,
          preferred_language: preferredLanguage || 'en',
          role: 'buyer',
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com'}/auth/callback?flow=invite&type=invite`,
      }
    );

    if (authError) {
      console.error('Error inviting buyer:', {
        message: authError.message,
        status: authError.status,
        fullError: JSON.stringify(authError, null, 2)
      });
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to invite user' },
        { status: 500 }
      );
    }

    console.log('[Buyer Creation] Step 2: Auth user created successfully', { userId: authData.user.id });

    // Create profile for the buyer using RPC function
    // This function uses SECURITY DEFINER to bypass RLS policies
    console.log('[Buyer Creation] Step 3: Creating profile via RPC', { 
      user_id: authData.user.id, 
      full_name: fullName, 
      preferred_language: preferredLanguage || 'en',
      role: 'buyer'
    });
    
    const { data: profileResult, error: buyerProfileError } = await supabaseAdmin
      .rpc('create_profile_for_user', {
        p_user_id: authData.user.id,
        p_full_name: fullName,
        p_role: 'buyer',
        p_preferred_language: preferredLanguage || 'en',
      });

    if (buyerProfileError) {
      console.error('Error creating buyer profile via RPC:', {
        message: buyerProfileError.message,
        details: buyerProfileError.details,
        hint: buyerProfileError.hint,
        code: buyerProfileError.code,
        fullError: JSON.stringify(buyerProfileError, null, 2)
      });
      // Clean up: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { 
          error: 'Database error saving new user',
          details: buyerProfileError.message,
          code: buyerProfileError.code,
          hint: buyerProfileError.hint
        },
        { status: 400 }
      );
    }

    // Check if profile creation was successful
    if (!profileResult || !profileResult.success) {
      console.error('Profile creation RPC returned error:', profileResult);
      // Clean up: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { 
          error: 'Database error saving new user',
          details: profileResult?.error || 'Unknown error from profile creation function'
        },
        { status: 400 }
      );
    }

    console.log('[Buyer Creation] Step 4: Profile created successfully', { profile: profileResult.profile });

    // Create buyer-agent association using admin client
    console.log('[Buyer Creation] Step 5: Creating buyer-agent association', {
      buyer_id: authData.user.id,
      agent_id: user.id
    });
    const { error: associationError } = await supabaseAdmin
      .from('buyer_agent_associations')
      .insert({
        buyer_id: authData.user.id,
        agent_id: user.id,
      });

    if (associationError) {
      console.error('Error creating buyer-agent association:', {
        message: associationError.message,
        details: associationError.details,
        hint: associationError.hint,
        code: associationError.code,
        fullError: JSON.stringify(associationError, null, 2)
      });
      // Clean up: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { 
          error: 'Failed to associate buyer with agent',
          details: associationError.message,
          code: associationError.code
        },
        { status: 500 }
      );
    }

    console.log('[Buyer Creation] Step 6: Association created successfully');

    return NextResponse.json({
      success: true,
      buyer: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        preferred_language: preferredLanguage || 'en',
      },
    });

  } catch (error: any) {
    console.error('Unexpected error in create buyer API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
