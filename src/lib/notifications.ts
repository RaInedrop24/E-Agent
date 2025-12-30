'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { MilestoneUpdateEmail } from '@/components/emails/MilestoneUpdateEmail';
import { NewMessageEmail } from '@/components/emails/NewMessageEmail';
import { FileUploadEmail } from '@/components/emails/FileUploadEmail';
import * as React from 'react';
import twilio from 'twilio';
import { t, tVar, type TranslationKey } from '@/lib/ui-translations';
import { SupportedLanguage } from '@/lib/translation';

const resend = new Resend(process.env.RESEND_API_KEY);

// Twilio Setup
console.log('[Notifications Init] Twilio SID present:', !!process.env.TWILIO_SID);
console.log('[Notifications Init] Twilio Secret present:', !!process.env.TWILIO_SECRET);
console.log('[Notifications Init] Twilio Phone Number:', process.env.TWILIO_PHONE_NUMBER);

const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_SECRET
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_SECRET)
  : null;
const twilioFrom = process.env.TWILIO_PHONE_NUMBER || 'PROPERTY';

if (!twilioClient) {
  console.warn('[Notifications Init] WARNING: Twilio client not initialized - SMS will not work!');
}

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
    
    // Helper function to get translated transaction title
    const getTranslatedTransactionTitle = (lang: SupportedLanguage) => {
      const langKey = `title_${lang}` as keyof typeof transaction;
      return (transaction[langKey] as string) || transaction.title_en || transaction.title || 'Untitled Transaction';
    };
    
    // Helper function to get translated milestone label
    // Note: This will need the milestone ID to fetch the translated label from DB
    // For now, we'll try to fetch it if milestoneId is provided in data
    const getTranslatedMilestoneLabel = async (milestoneId: string | undefined, milestoneTitle: string, lang: SupportedLanguage): Promise<string> => {
      if (milestoneId) {
        try {
          const { data: milestone } = await supabaseAdmin
            .from('milestones')
            .select('*')
            .eq('id', milestoneId)
            .single();
          
          if (milestone) {
            const langKey = `label_${lang}` as keyof typeof milestone;
            return (milestone[langKey] as string) || milestone.label_en || milestone.label_it || milestoneTitle;
          }
        } catch (error) {
          console.error('[Notifications] Error fetching milestone:', error);
        }
      }
      // Fallback to provided milestoneTitle
      return milestoneTitle;
    };

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

      // Get user's preferred language
      const userLanguage: SupportedLanguage = (profile.preferred_language as SupportedLanguage) || 'en';
      const translatedTransactionTitle = getTranslatedTransactionTitle(userLanguage);

      // --- SMS Logic ---
      if (profile.sms_alerts_enabled && profile.phone_number) {
        if (!twilioClient) {
          console.error(`[SMS] Cannot send to ${profile.full_name} - Twilio client not initialized. Check TWILIO_SID and TWILIO_SECRET in .env.local`);
        } else {
          let smsBody = '';
          if (type === 'MILESTONE_UPDATE') {
            const milestoneLabel = await getTranslatedMilestoneLabel(data.milestoneId, data.milestoneTitle, userLanguage);
            const statusText = data.status === 'completed' ? t('email.milestoneUpdate.completed' as TranslationKey, userLanguage) : 'pending';
            smsBody = tVar('sms.milestoneUpdate' as TranslationKey, userLanguage, {
              milestone: milestoneLabel,
              status: statusText,
              transaction: translatedTransactionTitle,
              url: `${siteUrl}/dashboard`,
            });
          } else if (type === 'NEW_MESSAGE') {
            smsBody = tVar('sms.newMessage' as TranslationKey, userLanguage, {
              author: data.authorName,
              transaction: translatedTransactionTitle,
              url: `${siteUrl}/dashboard`,
            });
          } else if (type === 'FILE_UPLOAD') {
            smsBody = tVar('sms.fileUpload' as TranslationKey, userLanguage, {
              fileName: data.fileName,
              uploader: data.uploaderName,
              transaction: translatedTransactionTitle,
              url: `${siteUrl}/dashboard`,
            });
          }

          if (smsBody) {
            try {
              console.log(`[SMS] Attempting to send to ${profile.phone_number}`);
              console.log(`[SMS] From number: ${twilioFrom}`);
              console.log(`[SMS] Message: ${smsBody}`);
              const result = await twilioClient.messages.create({
                body: smsBody,
                from: twilioFrom,
                to: profile.phone_number,
              });
              console.log(`[SMS] Successfully sent to ${profile.phone_number}. SID: ${result.sid}, Status: ${result.status}`);
            } catch (smsError: any) {
              console.error(`[SMS] Failed to send to ${profile.phone_number}:`, smsError);
              console.error(`[SMS] Error details:`, {
                message: smsError.message,
                code: smsError.code,
                status: smsError.status,
                moreInfo: smsError.moreInfo,
              });
            }
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
        
        // Get translated milestone label if this is a milestone update
        let milestoneLabel = '';
        if (type === 'MILESTONE_UPDATE') {
          milestoneLabel = await getTranslatedMilestoneLabel(data.milestoneId, data.milestoneTitle, userLanguage);
        }

        if (type === 'MILESTONE_UPDATE') {
           emailSubject = tVar('email.milestoneUpdate.subject' as TranslationKey, userLanguage, {
             title: translatedTransactionTitle,
           });
           emailComponent = React.createElement(MilestoneUpdateEmail, {
             transactionTitle: translatedTransactionTitle,
             milestoneTitle: milestoneLabel,
             status: data.status,
             updatedBy: data.updatedByName,
             transactionUrl: transactionUrl,
             brandLogoUrl: branding.logoUrl,
             brandColor: branding.color,
             translations: {
               title: t('email.milestoneUpdate.title' as TranslationKey, userLanguage),
               preview: tVar('email.milestoneUpdate.preview' as TranslationKey, userLanguage, {
                 milestone: milestoneLabel,
                 status: data.status === 'completed' ? t('email.milestoneUpdate.completed' as TranslationKey, userLanguage) : t('email.milestoneUpdate.markedPending' as TranslationKey, userLanguage),
               }),
               milestoneUpdated: t('email.milestoneUpdate.milestoneUpdated' as TranslationKey, userLanguage),
               nowCompleted: t('email.milestoneUpdate.nowCompleted' as TranslationKey, userLanguage),
               nowPending: t('email.milestoneUpdate.nowPending' as TranslationKey, userLanguage),
               viewDetails: t('email.milestoneUpdate.viewDetails' as TranslationKey, userLanguage),
               footer: t('email.milestoneUpdate.footer' as TranslationKey, userLanguage),
             },
           });
        } else if (type === 'NEW_MESSAGE') {
           emailSubject = tVar('email.newMessage.subject' as TranslationKey, userLanguage, {
             title: translatedTransactionTitle,
           });
           emailComponent = React.createElement(NewMessageEmail, {
             transactionTitle: translatedTransactionTitle,
             authorName: data.authorName,
             messagePreview: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
             transactionUrl: transactionUrl,
             brandLogoUrl: branding.logoUrl,
             brandColor: branding.color,
             translations: {
               title: t('email.newMessage.title' as TranslationKey, userLanguage),
               preview: tVar('email.newMessage.preview' as TranslationKey, userLanguage, {
                 author: data.authorName,
                 transaction: translatedTransactionTitle,
               }),
               sentMessage: t('email.newMessage.sentMessage' as TranslationKey, userLanguage),
               reply: t('email.newMessage.reply' as TranslationKey, userLanguage),
               footer: t('email.newMessage.footer' as TranslationKey, userLanguage),
             },
           });
        } else if (type === 'FILE_UPLOAD') {
           emailSubject = tVar('email.fileUpload.subject' as TranslationKey, userLanguage, {
             title: translatedTransactionTitle,
           });
           emailComponent = React.createElement(FileUploadEmail, {
             transactionTitle: translatedTransactionTitle,
             fileName: data.fileName,
             uploaderName: data.uploaderName,
             transactionUrl: transactionUrl,
             brandLogoUrl: branding.logoUrl,
             brandColor: branding.color,
             translations: {
               title: t('email.fileUpload.title' as TranslationKey, userLanguage),
               preview: tVar('email.fileUpload.preview' as TranslationKey, userLanguage, {
                 uploader: data.uploaderName,
                 fileName: data.fileName,
                 transaction: translatedTransactionTitle,
               }),
               uploadedFile: t('email.fileUpload.uploadedFile' as TranslationKey, userLanguage),
               viewDashboard: t('email.fileUpload.viewDashboard' as TranslationKey, userLanguage),
               footer: t('email.fileUpload.footer' as TranslationKey, userLanguage),
             },
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
