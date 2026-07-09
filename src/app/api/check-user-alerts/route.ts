/**
 * Debug endpoint: lists all users' alert settings.
 * Reads cross-tenant data, so it is restricted to super admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin, isSuperAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isSuperAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

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
  } catch (error) {
    logger.exception('[Check User Alerts] Error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lookup failed' },
      { status: 500 }
    );
  }
}
