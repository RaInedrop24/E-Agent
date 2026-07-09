import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

interface SendNotificationRequest {
  recipientType: 'agents' | 'buyers' | 'all';
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    // Parse request body
    const body: SendNotificationRequest = await request.json();
    const { recipientType, subject, message } = body;

    if (!recipientType || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch recipients based on type
    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name');

    if (recipientType === 'agents') {
      query = query.eq('role', 'agent');
    } else if (recipientType === 'buyers') {
      query = query.eq('role', 'buyer');
    }
    // 'all' means no filter needed

    const { data: recipients, error: recipientsError } = await query;

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 });
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 404 });
    }

    // Create the system announcement
    const { data: announcement, error: insertError } = await supabaseAdmin
      .from('system_announcements')
      .insert({
        admin_user_id: user.id,
        recipient_type: recipientType,
        message_type: 'notification',
        subject,
        message,
        recipient_count: recipients.length,
      })
      .select()
      .single();

    if (insertError || !announcement) {
      console.error('Error creating announcement:', insertError);
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }

    // Create user_notification entries for each recipient
    const userNotifications = recipients.map(recipient => ({
      user_id: recipient.id,
      announcement_id: announcement.id,
      read: false,
    }));

    const { error: notificationsError } = await supabaseAdmin
      .from('user_notifications')
      .insert(userNotifications);

    if (notificationsError) {
      console.error('Error creating user notifications:', notificationsError);
      // Don't fail the request - announcement was created
      // Users just won't see it until we fix the issue
    }

    console.log(`[System Notification] Sent to ${recipients.length} ${recipientType}: ${subject}`);

    return NextResponse.json({
      success: true,
      recipientCount: recipients.length,
      message: `Notification sent to ${recipients.length} ${recipientType}`,
    });

  } catch (error) {
    console.error('System notification API error:', error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : '') || 'Internal server error' },
      { status: 500 }
    );
  }
}

