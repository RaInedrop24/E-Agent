import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendBuyerWelcomeEmail, sendBuyerConnectionEmail } from '@/lib/email-service';

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

    // ========================================
    // STEP 1: Check if buyer already exists
    // ========================================
    console.log('[Buyer Creation] Step 1: Checking if buyer already exists', { email });
    
    // Use listUsers to check if email exists (filter by email)
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('[Buyer Creation] Error listing users:', listError);
      return NextResponse.json(
        { error: 'Database error checking for existing buyer' },
        { status: 500 }
      );
    }

    // Find user by email
    const existingAuthUser = userList.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    let existingProfile = null;
    
    // If auth user exists, get their profile
    if (existingAuthUser) {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', existingAuthUser.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('[Buyer Creation] Error fetching profile:', profileError);
        return NextResponse.json(
          { error: 'Database error checking for existing buyer' },
          { status: 500 }
        );
      }
      
      existingProfile = profileData;
    }

    // ========================================
    // SCENARIO A: Buyer EXISTS - Add association only
    // ========================================
    if (existingProfile) {
      console.log('[Buyer Creation] Buyer exists, checking agent association', {
        buyerId: existingProfile.id,
        agentId: user.id
      });

      // Check if this agent already has this buyer
      const { data: existingAssociation, error: associationCheckError } = await supabaseAdmin
        .from('buyer_agent_associations')
        .select('id')
        .eq('buyer_id', existingProfile.id)
        .eq('agent_id', user.id)
        .maybeSingle();

      if (associationCheckError) {
        console.error('[Buyer Creation] Error checking association:', associationCheckError);
        return NextResponse.json(
          { error: 'Database error checking buyer association' },
          { status: 500 }
        );
      }

      // Agent already has this buyer
      if (existingAssociation) {
        return NextResponse.json(
          { error: 'This buyer is already in your list' },
          { status: 400 }
        );
      }

      // Create new association (buyer exists but not for this agent)
      console.log('[Buyer Creation] Creating new association for existing buyer');
      const { error: newAssociationError } = await supabaseAdmin
        .from('buyer_agent_associations')
        .insert({
          buyer_id: existingProfile.id,
          agent_id: user.id,
        });

      if (newAssociationError) {
        console.error('[Buyer Creation] Error creating association:', newAssociationError);
        return NextResponse.json(
          { error: 'Failed to associate buyer with agent' },
          { status: 500 }
        );
      }

      // Get agent profile for connection notification
      const { data: agentProfile } = await supabaseAdmin
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      // Send connection notification email
      console.log('[Buyer Creation] Sending connection notification email');
      const emailResult = await sendBuyerConnectionEmail({
        to: email,
        buyerName: existingProfile.full_name || 'there',
        agentName: agentProfile?.full_name || 'Your agent',
        agentEmail: user.email || '',
        language: (preferredLanguage || 'en') as 'en' | 'it' | 'pl' | 'es' | 'fr' | 'nl' | 'de',
      });

      if (!emailResult.success) {
        console.error('[Buyer Creation] Failed to send connection notification:', emailResult.error);
        // Don't fail the operation if email fails
      } else {
        console.log('[Buyer Creation] Connection notification sent successfully');
      }

      console.log('[Buyer Creation] ✓ Existing buyer added successfully');

      return NextResponse.json({
        success: true,
        existingBuyer: true,
        buyer: {
          id: existingProfile.id,
          email: email,
          full_name: existingProfile.full_name,
        },
        emailSent: emailResult.success,
        message: emailResult.success
          ? `✓ Buyer added to your list! A notification email has been sent to ${email}.`
          : `✓ Buyer added to your list! This buyer is already registered and can log in with their existing credentials.`,
      });
    }

    // ========================================
    // SCENARIO B: New buyer - Create everything
    // ========================================
    console.log('[Buyer Creation] Step 2: Creating new buyer account', { email, fullName, preferredLanguage });
    
    // Simple default password that buyer will change on first login
    const defaultPassword = 'Welcome2026!';
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto-confirm email so they can login immediately
      user_metadata: {
        full_name: fullName,
        preferred_language: preferredLanguage || 'en',
        role: 'buyer',
        must_change_password: true, // Flag to force password change on first login
        first_login: true,
      },
    });

    if (authError) {
      console.error('Error creating buyer user:', {
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
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    console.log('[Buyer Creation] Step 3: Auth user created successfully', { userId: authData.user.id });

    // Note: Email will be sent separately with login credentials
    // TODO: Implement custom email with default password and login instructions

    // Create profile for the buyer using RPC function
    // This function uses SECURITY DEFINER to bypass RLS policies
    console.log('[Buyer Creation] Step 4: Creating profile via RPC', { 
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

    console.log('[Buyer Creation] Step 5: Profile created successfully', { profile: profileResult.profile });

    // Create buyer-agent association using admin client
    console.log('[Buyer Creation] Step 6: Creating buyer-agent association', {
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

    console.log('[Buyer Creation] Step 7: Association created successfully');

    // Step 8: Send welcome email with credentials
    console.log('[Buyer Creation] Step 8: Sending welcome email');
    const emailResult = await sendBuyerWelcomeEmail({
      to: email,
      fullName,
      password: defaultPassword,
      language: (preferredLanguage || 'en') as 'en' | 'it' | 'pl' | 'es' | 'fr' | 'nl' | 'de',
    });

    if (!emailResult.success) {
      console.error('[Buyer Creation] Failed to send welcome email:', emailResult.error);
      // Don't fail the whole operation if email fails - agent can manually share credentials
    } else {
      console.log('[Buyer Creation] Welcome email sent successfully');
    }

    return NextResponse.json({
      success: true,
      buyer: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        preferred_language: preferredLanguage || 'en',
      },
      defaultPassword: defaultPassword, // Return password so agent can communicate it to buyer
      emailSent: emailResult.success,
      message: emailResult.success 
        ? `Buyer created successfully! Welcome email sent to ${email} with login credentials.`
        : `Buyer created successfully. Default password: ${defaultPassword}. (Email failed to send - please share credentials manually)`,
    });

  } catch (error: any) {
    console.error('Unexpected error in create buyer API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
