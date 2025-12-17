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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is an agent
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'agent') {
      return NextResponse.json(
        { error: 'Only agents can resend invites' },
        { status: 403 }
      );
    }

    // Parse request body
    const { buyerId } = await request.json();

    if (!buyerId) {
      return NextResponse.json(
        { error: 'Buyer ID is required' },
        { status: 400 }
      );
    }

    // Verify the buyer belongs to this agent
    const { data: association, error: assocError } = await supabaseAdmin
      .from('buyer_agent_associations')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('agent_id', user.id)
      .single();

    if (assocError || !association) {
      return NextResponse.json(
        { error: 'Buyer not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Get buyer email
    const { data: buyerAuth, error: buyerAuthError } = await supabaseAdmin.auth.admin.getUserById(buyerId);

    if (buyerAuthError || !buyerAuth.user?.email) {
      return NextResponse.json(
        { error: 'Could not find buyer email' },
        { status: 404 }
      );
    }

    // Resend invitation using admin generateLink
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: buyerAuth.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com'}/auth/callback?flow=invite`,
      },
    });

    if (linkError) {
      console.error('Error generating invite link:', linkError);
      return NextResponse.json(
        { error: 'Failed to generate invitation' },
        { status: 500 }
      );
    }

    // Send the invite email manually using the generated link
    // Note: This requires additional email sending setup
    // For now, we'll use the password recovery flow as a workaround
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      buyerAuth.user.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com'}/auth/callback?flow=invite`,
      }
    );

    if (resetError) {
      console.error('Error sending password reset email:', resetError);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation resent successfully',
    });

  } catch (error: any) {
    console.error('Unexpected error in resend invite API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
