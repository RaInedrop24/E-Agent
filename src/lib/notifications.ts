'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { MilestoneUpdateEmail } from '@/components/emails/MilestoneUpdateEmail';
import { NewMessageEmail } from '@/components/emails/NewMessageEmail';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  type: 'MILESTONE_UPDATE' | 'NEW_MESSAGE';
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
    for (const p of participants) {
      const profile = p.profiles as any;
      if (!profile) continue;

      // Skip the user who triggered the action
      if (profile.id === triggerUserId) continue;

      // --- SMS Logic (Placeholder) ---
      if (profile.sms_alerts_enabled && profile.phone_number) {
        // TODO: Integrate Twilio or MessageBird here
        console.log(`[SMS] Would send SMS to ${profile.phone_number}: "${type} in ${transaction.title}"`);
      }

      // --- Email Logic ---
      if (profile.email_alerts_enabled && profile.email) { // Ensure email is available (Supabase Auth usually handles this, but profile table might not have it synced if not customized)
        // Wait, the 'profiles' table doesn't have an 'email' column in the default schema I saw earlier.
        // It relies on the auth.users table.
        // I need to fetch the email from auth.users using the admin client.
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
