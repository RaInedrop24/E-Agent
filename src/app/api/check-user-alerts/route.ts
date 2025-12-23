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
    // Get all users with their alert settings
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email_alerts_enabled, sms_alerts_enabled, phone_number, role')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Also get email addresses from auth.users
    const profilesWithEmails = await Promise.all(
      profiles.map(async (profile) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        return {
          ...profile,
          email: userData?.user?.email || null,
        };
      })
    );

    return NextResponse.json({
      profiles: profilesWithEmails,
      summary: {
        total: profilesWithEmails.length,
        emailAlertsEnabled: profilesWithEmails.filter(p => p.email_alerts_enabled).length,
        smsAlertsEnabled: profilesWithEmails.filter(p => p.sms_alerts_enabled).length,
        withPhoneNumber: profilesWithEmails.filter(p => p.phone_number).length,
      },
    });
  } catch (error: any) {
    console.error('[Check User Alerts] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
