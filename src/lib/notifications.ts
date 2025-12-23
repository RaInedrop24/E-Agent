'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { MilestoneUpdateEmail } from '@/components/emails/MilestoneUpdateEmail';
import { NewMessageEmail } from '@/components/emails/NewMessageEmail';
import { FileUploadEmail } from '@/components/emails/FileUploadEmail';
import * as React from 'react';
import twilio from 'twilio';

const resend = new Resend(process.env.RESEND_API_KEY);

// Twilio Setup
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_SECRET);
const twilioFrom = process.env.TWILIO_PHONE_NUMBER || 'PROPERTY';

// Use Admin client to fetch participant details and settings even if RLS would block
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

interface NotificationPayload {
  transactionId: string;
  triggerUserId: string; // User who triggered the action (don't notify them)
  type: 'MILESTONE_UPDATE' | 'NEW_MESSAGE' | 'FILE_UPLOAD';
  data: any;
}

export async function sendNotifications({ transactionId, triggerUserId, type, data }: NotificationPayload) {
  try {
    console.log(`[Notifications] Processing ${type} for transaction ${transactionId}`);

    // 1. Fetch Transaction Details (for branding and title)
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*, profiles!transactions_created_by_fkey(branding_logo_url, branding_settings)')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      console.error('[Notifications] Transaction not found:', txError);
      return;
    }

    // 2. Extract Branding
    const agentProfile = transaction.profiles as any;
    const branding = {
      logoUrl: agentProfile?.branding_logo_url,
      color: agentProfile?.branding_settings?.primary,
    };

    // 3. Fetch Participants (including creator and invited buyers)
    // We need their profiles to check alert settings
    const { data: participants, error: pError } = await supabaseAdmin
      .from('transaction_participants')
      .select('profile_id, profiles!transaction_participants_profile_id_fkey(*)')
      .eq('transaction_id', transactionId);

    if (pError) {
      console.error('[Notifications] Failed to fetch participants:', pError);
      return;
    }

    // Also fetch the creator's profile if they are not in the participants list (though they should be)
    // For simplicity, let's assume the participants list is the source of truth for "Who is involved".
    // If the creator is not in that list, we might miss them, but typically creators are participants.

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com';
    const transactionUrl = `${siteUrl}/transaction/${transactionId}`;
    const emailFrom = 'Updates <Updates@mail.thepropertygateway.com>';

    // 4. Iterate and Notify
    console.log(`[Notifications] Found ${participants.length} participants.`);
    
    for (const p of participants) {
      const profile = p.profiles as any;
      if (!profile) continue;

      // Skip the user who triggered the action
      if (profile.id === triggerUserId) {
        console.log(`[Notifications] Skipping trigger user ${profile.full_name} (${profile.id})`);
        continue;
      }

      console.log(`[Notifications] Checking alerts for ${profile.full_name}: Email=${profile.email_alerts_enabled}, SMS=${profile.sms_alerts_enabled}`);

      // --- SMS Logic ---
      if (profile.sms_alerts_enabled && profile.phone_number) {
        let smsBody = '';
        if (type === 'MILESTONE_UPDATE') {
          smsBody = `Update: ${data.milestoneTitle} is now ${data.status} in transaction "${transaction.title}". View at: ${siteUrl}/dashboard`;
        } else if (type === 'NEW_MESSAGE') {
          smsBody = `New message from ${data.authorName} in "${transaction.title}". Reply at: ${siteUrl}/dashboard`;
        } else if (type === 'FILE_UPLOAD') {
          smsBody = `New file "${data.fileName}" uploaded by ${data.uploaderName} to "${transaction.title}". View at: ${siteUrl}/dashboard`;
        }

        if (smsBody) {
          try {
            console.log(`[SMS] Attempting to send to ${profile.phone_number}`);
            const result = await twilioClient.messages.create({
              body: smsBody,
              from: twilioFrom,
              to: profile.phone_number,
            });
            console.log(`[SMS] Successfully sent to ${profile.phone_number}. SID: ${result.sid}`);
          } catch (smsError: any) {
            console.error(`[SMS] Failed to send to ${profile.phone_number}:`, smsError);
            console.error(`[SMS] Error details:`, {
              message: smsError.message,
              code: smsError.code,
              status: smsError.status,
            });
          }
        }
      } else {
        if (profile.sms_alerts_enabled) {
          console.log(`[SMS] Skipping ${profile.full_name} - alerts enabled but no phone number`);
        }
      }

      // --- Email Logic ---
      if (profile.email_alerts_enabled) {
        // Fetch email from auth.users table using the admin client
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        
        if (userError || !userData.user || !userData.user.email) {
            console.warn(`[Notifications] Could not find email for user ${profile.id}`);
            continue;
        }

        const recipientEmail = userData.user.email;
        let emailSubject = '';
        let emailComponent = null;

        if (type === 'MILESTONE_UPDATE') {
           emailSubject = `Update: ${transaction.title}`;
           emailComponent = React.createElement(MilestoneUpdateEmail, {
             transactionTitle: transaction.title,
             milestoneTitle: data.milestoneTitle,
             status: data.status,
             updatedBy: data.updatedByName,
             transactionUrl: transactionUrl,
             brandLogoUrl: branding.logoUrl,
             brandColor: branding.color,
           });
        } else if (type === 'NEW_MESSAGE') {
           emailSubject = `New Message in ${transaction.title}`;
           emailComponent = React.createElement(NewMessageEmail, {
             transactionTitle: transaction.title,
             authorName: data.authorName,
             messagePreview: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
             transactionUrl: transactionUrl,
             brandLogoUrl: branding.logoUrl,
             brandColor: branding.color,
           });
        } else if (type === 'FILE_UPLOAD') {
           emailSubject = `New File in ${transaction.title}`;
           emailComponent = React.createElement(FileUploadEmail, {
             transactionTitle: transaction.title,
             fileName: data.fileName,
             uploaderName: data.uploaderName,
             transactionUrl: transactionUrl,
             brandLogoUrl: branding.logoUrl,
             brandColor: branding.color,
           });
        }

        if (emailComponent) {
          try {
             await resend.emails.send({
               from: emailFrom,
               to: recipientEmail,
               subject: emailSubject,
               react: emailComponent,
             });
             console.log(`[Email] Sent to ${recipientEmail}`);
          } catch (sendError) {
             console.error(`[Email] Failed to send to ${recipientEmail}:`, sendError);
          }
        }
      }
    }

  } catch (error) {
    console.error('[Notifications] Fatal error:', error);
  }
}
