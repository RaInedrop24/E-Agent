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

interface MarkReadRequest {
  notificationId?: string;
  markAllAsRead?: boolean;
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

    const body: MarkReadRequest = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all unread notifications as read for this user
      const { error: updateError } = await supabaseAdmin
        .from('user_notifications')
        .update({ 
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('read', false);

      if (updateError) {
        console.error('Error marking all as read:', updateError);
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    } else if (notificationId) {
      // Mark specific notification as read
      const { error: updateError } = await supabaseAdmin
        .from('user_notifications')
        .update({ 
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id); // Ensure user owns this notification

      if (updateError) {
        console.error('Error marking notification as read:', updateError);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    } else {
      return NextResponse.json({ error: 'Missing notificationId or markAllAsRead flag' }, { status: 400 });
    }

  } catch (error) {
    console.error('Mark read API error:', error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : '') || 'Internal server error' },
      { status: 500 }
    );
  }
}

