import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { translateText, SupportedLanguage } from '@/lib/translation';

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

    // Get user's profile to determine role and preferred language
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, preferred_language')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Fetch user's notifications with announcement details
    const { data: notifications, error: notificationsError } = await supabaseAdmin
      .from('user_notifications_with_details')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Translate notifications if user's preferred language is not English
    const userLanguage = (profile.preferred_language as SupportedLanguage) || 'en';
    // Fields used from the user_notifications_with_details view row
    interface NotificationRow {
      id: string;
      subject: string;
      message: string;
      translated_subject: string | null;
      translated_message: string | null;
      translation_language: string | null;
      [key: string]: unknown;
    }

    const translatedNotifications = await Promise.all(
      (notifications || []).map(async (notification: NotificationRow) => {
        // If user's language is English, return original
        if (userLanguage === 'en') {
          return notification;
        }

        // Check if translation already exists in database
        if (notification.translated_subject && 
            notification.translated_message && 
            notification.translation_language === userLanguage) {
          // Use cached translation
          return {
            ...notification,
            subject: notification.translated_subject,
            message: notification.translated_message,
            original_subject: notification.subject,
            original_message: notification.message,
          };
        }

        // Translation doesn't exist or is for different language - translate and store
        try {
          // Translate subject and message
          const [subjectTranslation, messageTranslation] = await Promise.all([
            translateText(notification.subject, userLanguage, 'en'),
            translateText(notification.message, userLanguage, 'en'),
          ]);

          // Store translations in database for future use
          await supabaseAdmin
            .from('user_notifications')
            .update({
              translated_subject: subjectTranslation.translatedText,
              translated_message: messageTranslation.translatedText,
              translation_language: userLanguage,
            })
            .eq('id', notification.id);

          return {
            ...notification,
            subject: subjectTranslation.translatedText,
            message: messageTranslation.translatedText,
            original_subject: notification.subject,
            original_message: notification.message,
          };
        } catch (translationError) {
          console.error('Error translating notification:', translationError);
          // Return original if translation fails
          return notification;
        }
      })
    );

    // Get unread count
    const { data: unreadCount, error: countError } = await supabaseAdmin
      .rpc('get_unread_notification_count', { user_uuid: user.id });

    if (countError) {
      console.error('Error fetching unread count:', countError);
    }

    return NextResponse.json({
      notifications: translatedNotifications,
      unreadCount: unreadCount || 0,
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : '') || 'Internal server error' },
      { status: 500 }
    );
  }
}

