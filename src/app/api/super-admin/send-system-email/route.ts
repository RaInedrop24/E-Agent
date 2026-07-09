import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { SystemAnnouncementEmail } from '@/components/emails/SystemAnnouncementEmail';
import { translateText, SupportedLanguage } from '@/lib/translation';
import { SITE_URL } from '@/lib/constants';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

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

interface SendEmailRequest {
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
    const body: SendEmailRequest = await request.json();
    const { recipientType, subject, message } = body;

    if (!recipientType || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch recipients based on type (including preferred_language)
    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, preferred_language');

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

    // Fetch email addresses for all recipients
    const recipientEmails: Array<{ 
      email: string; 
      role: string; 
      name: string; 
      preferred_language: string;
    }> = [];
    
    for (const recipient of recipients) {
      const { data: userData, error: emailError } = await supabaseAdmin.auth.admin.getUserById(recipient.id);
      
      if (!emailError && userData.user && userData.user.email) {
        recipientEmails.push({
          email: userData.user.email,
          role: recipient.role,
          name: recipient.full_name,
          preferred_language: recipient.preferred_language || 'en',
        });
      }
    }

    if (recipientEmails.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses found' }, { status: 404 });
    }

    const siteUrl = SITE_URL;
    const emailFrom = 'System Notifications <system@mail.thepropertygateway.com>';

    // Send emails with rate limiting (Resend free tier: 2 emails per second)
    const EMAILS_PER_SECOND = 2;
    const DELAY_MS = 1000; // 1 second between batches
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Process emails in batches of 2 (rate limit)
    for (let i = 0; i < recipientEmails.length; i += EMAILS_PER_SECOND) {
      const batch = recipientEmails.slice(i, i + EMAILS_PER_SECOND);
      
      const emailPromises = batch.map(async (recipient) => {
        try {
          // Translate subject and message based on recipient's preferred language
          const recipientLanguage = (recipient.preferred_language as SupportedLanguage) || 'en';
          let translatedSubject = subject;
          let translatedMessage = message;

          if (recipientLanguage !== 'en') {
            try {
              const [subjectTranslation, messageTranslation] = await Promise.all([
                translateText(subject, recipientLanguage, 'en'),
                translateText(message, recipientLanguage, 'en'),
              ]);
              translatedSubject = subjectTranslation.translatedText;
              translatedMessage = messageTranslation.translatedText;
            } catch (translationError) {
              console.error(`[System Email] Translation failed for ${recipient.email} (${recipientLanguage}):`, translationError);
              // Continue with original English text if translation fails
            }
          }

          const emailComponent = React.createElement(SystemAnnouncementEmail, {
            subject: translatedSubject,
            message: translatedMessage,
            recipientType: recipient.role === 'agent' ? 'agent' : 'buyer',
            siteUrl,
            language: recipientLanguage,
          });

          await resend.emails.send({
            from: emailFrom,
            to: recipient.email,
            subject: `System Announcement: ${translatedSubject}`,
            react: emailComponent,
          });

          console.log(`[System Email] Sent to ${recipient.email} (${recipient.name}) in ${recipientLanguage}`);
          return { success: true, email: recipient.email };
        } catch (sendError) {
          console.error(`[System Email] Failed to send to ${recipient.email}:`, sendError);
          return { success: false, email: recipient.email, error: sendError instanceof Error ? sendError.message : String(sendError) };
        }
      });

      const results = await Promise.allSettled(emailPromises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          failureCount++;
          if (result.status === 'fulfilled' && result.value.error) {
            errors.push(`${result.value.email}: ${result.value.error}`);
          } else if (result.status === 'rejected') {
            errors.push(result.reason);
          }
        }
      });

      // Wait 1 second between batches to respect rate limit
      if (i + EMAILS_PER_SECOND < recipientEmails.length) {
        console.log(`[System Email] Rate limiting: waiting ${DELAY_MS}ms... (${successCount + failureCount}/${recipientEmails.length} sent)`);
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    // Log the announcement to the database
    const { error: insertError } = await supabaseAdmin
      .from('system_announcements')
      .insert({
        admin_user_id: user.id,
        recipient_type: recipientType,
        message_type: 'email',
        subject,
        message,
        recipient_count: successCount,
      });

    if (insertError) {
      console.error('Error logging announcement:', insertError);
    }

    console.log(`[System Email] Completed: ${successCount} sent, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      totalRecipients: recipientEmails.length,
      errors: failureCount > 0 ? errors.slice(0, 10) : [], // Return first 10 errors only
      message: `Successfully sent ${successCount} of ${recipientEmails.length} emails`,
    });

  } catch (error) {
    console.error('System email API error:', error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : '') || 'Internal server error' },
      { status: 500 }
    );
  }
}

