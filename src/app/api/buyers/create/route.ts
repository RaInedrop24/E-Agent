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

    // Create the buyer user using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        preferred_language: preferredLanguage || 'en',
        role: 'buyer',
      },
    });

    if (authError) {
      console.error('Error creating buyer auth user:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create buyer-agent association using admin client
    const { error: associationError } = await supabaseAdmin
      .from('buyer_agent_associations')
      .insert({
        buyer_id: authData.user.id,
        agent_id: user.id,
      });

    if (associationError) {
      console.error('Error creating buyer-agent association:', associationError);
      // Clean up: delete the auth user we just created
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to associate buyer with agent' },
        { status: 500 }
      );
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/callback?type=recovery`,
    });

    if (resetError) {
      console.error('Error sending password reset email:', resetError);
      // Don't fail the request - the buyer was created successfully
      // The agent can resend the invite manually
    }

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
