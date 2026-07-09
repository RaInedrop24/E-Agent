import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', details: userError },
        { status: 401 }
      );
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'Profile already exists',
        profile: existingProfile,
      });
    }

    // Try to create profile using raw SQL via RPC
    // First, let's try direct insert
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'User',
        role: user.user_metadata?.role || 'buyer',
        preferred_language: user.user_metadata?.preferred_language || 'en',
      })
      .select()
      .single();

    if (insertError) {
      // If direct insert fails due to RLS, try using a SQL function
      console.error('Direct insert failed:', insertError);

      return NextResponse.json({
        error: 'Failed to create profile',
        details: insertError,
        hint: 'Please apply the RLS fix SQL: supabase/fix_rls_recursion.sql',
        user: {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully',
      profile: newProfile,
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
