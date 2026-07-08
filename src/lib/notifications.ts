'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { MilestoneUpdateEmail } from '@/components/emails/MilestoneUpdateEmail';
import { NewMessageEmail } from '@/components/emails/NewMessageEmail';
import { FileUploadEmail } from '@/components/emails/FileUploadEmail';
import { TransactionClosingEmail } from '@/components/emails/TransactionClosingEmail';
import * as React from 'react';
import twilio from 'twilio';
import { t, tVar, type TranslationKey } from '@/lib/ui-translations';
import { SupportedLanguage } from '@/lib/translation';
import { toSupportedLanguage } from '@/lib/constants';
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

// Twilio Setup
const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_SECRET
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_SECRET)
  : null;
const twilioFrom = process.env.TWILIO_PHONE_NUMBER || 'PROPERTY';

if (!twilioClient) {
  logger.warn('[Notifications Init] Twilio client not initialized - SMS will not work');
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

interface MilestoneUpdateData {
  milestoneId?: string;
  milestoneTitle: string;
  status: 'completed' | 'pending';
  updatedByName: string;
  isLastMilestone?: boolean;
}

interface NewMessageData {
  authorName: string;
  content: string;
}

interface FileUploadData {
  fileName: string;
  uploaderName: string;
}

interface TransactionFinalizedData {
  agentName: string;
}

interface BasePayload {
  transactionId: string;
  /** User who triggered the action (don't notify them) */
  triggerUserId: string;
}

export type NotificationPayload =
  | (BasePayload & { type: 'MILESTONE_UPDATE'; data: MilestoneUpdateData })
  | (BasePayload & { type: 'NEW_MESSAGE'; data: NewMessageData })
  | (BasePayload & { type: 'FILE_UPLOAD'; data: FileUploadData })
  | (BasePayload & { type: 'TRANSACTION_FINALIZED'; data: TransactionFinalizedData });

interface ParticipantProfile {
  id: string;
  full_name: string | null;
  preferred_language: string | null;
  email_alerts_enabled: boolean | null;
  sms_alerts_enabled: boolean | null;
  phone_number: string | null;
}

interface Branding {
  logoUrl?: string;
  color?: string;
}

export async function sendNotifications(payload: NotificationPayload) {
  const { transactionId, triggerUserId, type } = payload;

  try {
    logger.info('[Notifications] Processing', { type, transactionId });

    // 1. Fetch Transaction Details (for branding and title)
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*, profiles!transactions_created_by_fkey(branding_logo_url, branding_settings)')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      logger.error('[Notifications] Transaction not found', { transactionId, error: txError?.message });
      return;
    }

    const getTranslatedTransactionTitle = (lang: SupportedLanguage) => {
      const langKey = `title_${lang}` as keyof typeof transaction;
      return (transaction[langKey] as string) || transaction.title_en || transaction.title || 'Untitled Transaction';
    };

    // 2. For milestone updates, fetch the milestone row ONCE (not per participant)
    let milestoneRow: Record<string, unknown> | null = null;
    if (payload.type === 'MILESTONE_UPDATE' && payload.data.milestoneId) {
      const { data: milestone, error: milestoneError } = await supabaseAdmin
        .from('milestones')
        .select('*')
        .eq('id', payload.data.milestoneId)
        .single();

      if (milestoneError) {
        logger.warn('[Notifications] Could not fetch milestone, using fallback title', {
          milestoneId: payload.data.milestoneId,
          error: milestoneError.message,
        });
      } else {
        milestoneRow = milestone;
      }
    }

    const getMilestoneLabel = (fallbackTitle: string, lang: SupportedLanguage): string => {
      if (milestoneRow) {
        return (
          (milestoneRow[`label_${lang}`] as string) ||
          (milestoneRow.label_en as string) ||
          (milestoneRow.label_it as string) ||
          fallbackTitle
        );
      }
      return fallbackTitle;
    };

    // 3. Extract Branding
    const agentProfile = transaction.profiles as {
      branding_logo_url?: string;
      branding_settings?: { primary?: string };
    } | null;
    const branding: Branding = {
      logoUrl: agentProfile?.branding_logo_url,
      color: agentProfile?.branding_settings?.primary,
    };

    // 4. Fetch Participants (including creator and invited buyers)
    const { data: participants, error: pError } = await supabaseAdmin
      .from('transaction_participants')
      .select('profile_id, profiles!transaction_participants_profile_id_fkey(*)')
      .eq('transaction_id', transactionId);

    if (pError) {
      logger.error('[Notifications] Failed to fetch participants', { transactionId, error: pError.message });
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com';
    const transactionUrl = `${siteUrl}/transaction/${transactionId}`;
    const emailFrom = 'Updates <Updates@mail.thepropertygateway.com>';

    // 5. Filter out the trigger user and missing profiles
    const recipients = (participants ?? [])
      .map((p) => p.profiles as unknown as ParticipantProfile | null)
      .filter((profile): profile is ParticipantProfile => !!profile && profile.id !== triggerUserId);

    logger.info('[Notifications] Dispatching', {
      participantCount: participants?.length ?? 0,
      recipientCount: recipients.length,
    });

    // 6. Batch-fetch recipient emails up front (avoids serial N+1 lookups)
    const emails = new Map<string, string>();
    await Promise.all(
      recipients
        .filter((profile) => profile.email_alerts_enabled)
        .map(async (profile) => {
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          if (userError || !userData.user?.email) {
            logger.warn('[Notifications] Could not find email for user', { userId: profile.id });
            return;
          }
          emails.set(profile.id, userData.user.email);
        })
    );

    // 7. Notify all recipients in parallel; one failure must not drop the rest
    const results = await Promise.allSettled(
      recipients.map((profile) =>
        notifyParticipant(profile, {
          payload,
          branding,
          siteUrl,
          transactionUrl,
          emailFrom,
          recipientEmail: emails.get(profile.id),
          getTranslatedTransactionTitle,
          getMilestoneLabel,
        })
      )
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      logger.error('[Notifications] Some notifications failed', {
        failed: failures.length,
        total: results.length,
      });
    }
  } catch (error) {
    logger.error('[Notifications] Fatal error', {
      transactionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

interface DispatchContext {
  payload: NotificationPayload;
  branding: Branding;
  siteUrl: string;
  transactionUrl: string;
  emailFrom: string;
  recipientEmail: string | undefined;
  getTranslatedTransactionTitle: (lang: SupportedLanguage) => string;
  getMilestoneLabel: (fallbackTitle: string, lang: SupportedLanguage) => string;
}

async function notifyParticipant(profile: ParticipantProfile, ctx: DispatchContext) {
  const { payload, branding, siteUrl, transactionUrl, emailFrom, recipientEmail } = ctx;

  // Validate the stored language before using it as a translation target
  const userLanguage = toSupportedLanguage(profile.preferred_language);
  const translatedTransactionTitle = ctx.getTranslatedTransactionTitle(userLanguage);

  const sendSms = async () => {
    if (!profile.sms_alerts_enabled) return;
    if (!profile.phone_number) {
      logger.debug('[SMS] Skipping recipient - alerts enabled but no phone number', { userId: profile.id });
      return;
    }
    if (!twilioClient) {
      logger.error('[SMS] Twilio client not initialized - check TWILIO_SID and TWILIO_SECRET');
      return;
    }

    let smsBody = '';
    if (payload.type === 'MILESTONE_UPDATE') {
      const milestoneLabel = ctx.getMilestoneLabel(payload.data.milestoneTitle, userLanguage);
      const statusText = payload.data.status === 'completed'
        ? t('email.milestoneUpdate.completed' as TranslationKey, userLanguage)
        : 'pending';

      if (payload.data.isLastMilestone) {
        smsBody = tVar('sms.finalMilestone' as TranslationKey, userLanguage, {
          milestone: milestoneLabel,
          transaction: translatedTransactionTitle,
          url: `${siteUrl}/dashboard`,
        });
      } else {
        smsBody = tVar('sms.milestoneUpdate' as TranslationKey, userLanguage, {
          milestone: milestoneLabel,
          status: statusText,
          transaction: translatedTransactionTitle,
          url: `${siteUrl}/dashboard`,
        });
      }
    } else if (payload.type === 'TRANSACTION_FINALIZED') {
      smsBody = tVar('sms.closing' as TranslationKey, userLanguage, {
        transaction: translatedTransactionTitle,
        agent: payload.data.agentName,
        url: `${siteUrl}/dashboard`,
      });
    } else if (payload.type === 'NEW_MESSAGE') {
      smsBody = tVar('sms.newMessage' as TranslationKey, userLanguage, {
        author: payload.data.authorName,
        transaction: translatedTransactionTitle,
        url: `${siteUrl}/dashboard`,
      });
    } else if (payload.type === 'FILE_UPLOAD') {
      smsBody = tVar('sms.fileUpload' as TranslationKey, userLanguage, {
        fileName: payload.data.fileName,
        uploader: payload.data.uploaderName,
        transaction: translatedTransactionTitle,
        url: `${siteUrl}/dashboard`,
      });
    }

    if (!smsBody) return;

    try {
      const result = await twilioClient.messages.create({
        body: smsBody,
        from: twilioFrom,
        to: profile.phone_number,
      });
      logger.info('[SMS] Sent', { sid: result.sid, status: result.status });
    } catch (smsError) {
      const err = smsError as { message?: string; code?: string | number };
      logger.error('[SMS] Failed to send', {
        userId: profile.id,
        error: err.message,
        code: err.code,
      });
    }
  };

  const sendEmail = async () => {
    if (!profile.email_alerts_enabled) return;
    if (!recipientEmail) return; // Already logged during batch fetch

    let emailSubject = '';
    let emailComponent: React.ReactElement | null = null;

    if (payload.type === 'MILESTONE_UPDATE') {
      const milestoneLabel = ctx.getMilestoneLabel(payload.data.milestoneTitle, userLanguage);
      emailSubject = tVar('email.milestoneUpdate.subject' as TranslationKey, userLanguage, {
        title: translatedTransactionTitle,
      });
      emailComponent = React.createElement(MilestoneUpdateEmail, {
        transactionTitle: translatedTransactionTitle,
        milestoneTitle: milestoneLabel,
        status: payload.data.status,
        updatedBy: payload.data.updatedByName,
        transactionUrl: transactionUrl,
        brandLogoUrl: branding.logoUrl,
        brandColor: branding.color,
        isLastMilestone: payload.data.isLastMilestone || false,
        translations: {
          title: t('email.milestoneUpdate.title' as TranslationKey, userLanguage),
          preview: tVar('email.milestoneUpdate.preview' as TranslationKey, userLanguage, {
            milestone: milestoneLabel,
            status: payload.data.status === 'completed'
              ? t('email.milestoneUpdate.completed' as TranslationKey, userLanguage)
              : t('email.milestoneUpdate.markedPending' as TranslationKey, userLanguage),
          }),
          milestoneUpdated: t('email.milestoneUpdate.milestoneUpdated' as TranslationKey, userLanguage),
          nowCompleted: t('email.milestoneUpdate.nowCompleted' as TranslationKey, userLanguage),
          nowPending: t('email.milestoneUpdate.nowPending' as TranslationKey, userLanguage),
          viewDetails: t('email.milestoneUpdate.viewDetails' as TranslationKey, userLanguage),
          footer: t('email.milestoneUpdate.footer' as TranslationKey, userLanguage),
          finalMilestoneMessage: t('email.milestoneUpdate.finalMilestoneMessage' as TranslationKey, userLanguage),
          portalAccessReminder: t('email.milestoneUpdate.portalAccessReminder' as TranslationKey, userLanguage),
        },
      });
    } else if (payload.type === 'TRANSACTION_FINALIZED') {
      emailSubject = tVar('email.closing.subject' as TranslationKey, userLanguage, {
        title: translatedTransactionTitle,
      });
      emailComponent = React.createElement(TransactionClosingEmail, {
        transactionTitle: translatedTransactionTitle,
        agentName: payload.data.agentName,
        transactionUrl: transactionUrl,
        brandLogoUrl: branding.logoUrl,
        brandColor: branding.color,
        translations: {
          title: t('email.closing.title' as TranslationKey, userLanguage),
          preview: tVar('email.closing.preview' as TranslationKey, userLanguage, {
            transaction: translatedTransactionTitle,
          }),
          congratulations: t('email.closing.congratulations' as TranslationKey, userLanguage),
          thankYouMessage: tVar('email.closing.thankYouMessage' as TranslationKey, userLanguage, {
            agent: payload.data.agentName,
          }),
          portalAccess: t('email.closing.portalAccess' as TranslationKey, userLanguage),
          viewDashboard: t('email.closing.viewDashboard' as TranslationKey, userLanguage),
          footer: t('email.closing.footer' as TranslationKey, userLanguage),
        },
      });
    } else if (payload.type === 'NEW_MESSAGE') {
      emailSubject = tVar('email.newMessage.subject' as TranslationKey, userLanguage, {
        title: translatedTransactionTitle,
      });
      emailComponent = React.createElement(NewMessageEmail, {
        transactionTitle: translatedTransactionTitle,
        authorName: payload.data.authorName,
        messagePreview: payload.data.content.substring(0, 100) + (payload.data.content.length > 100 ? '...' : ''),
        transactionUrl: transactionUrl,
        brandLogoUrl: branding.logoUrl,
        brandColor: branding.color,
        translations: {
          title: t('email.newMessage.title' as TranslationKey, userLanguage),
          preview: tVar('email.newMessage.preview' as TranslationKey, userLanguage, {
            author: payload.data.authorName,
            transaction: translatedTransactionTitle,
          }),
          sentMessage: t('email.newMessage.sentMessage' as TranslationKey, userLanguage),
          reply: t('email.newMessage.reply' as TranslationKey, userLanguage),
          footer: t('email.newMessage.footer' as TranslationKey, userLanguage),
        },
      });
    } else if (payload.type === 'FILE_UPLOAD') {
      emailSubject = tVar('email.fileUpload.subject' as TranslationKey, userLanguage, {
        title: translatedTransactionTitle,
      });
      emailComponent = React.createElement(FileUploadEmail, {
        transactionTitle: translatedTransactionTitle,
        fileName: payload.data.fileName,
        uploaderName: payload.data.uploaderName,
        transactionUrl: transactionUrl,
        brandLogoUrl: branding.logoUrl,
        brandColor: branding.color,
        translations: {
          title: t('email.fileUpload.title' as TranslationKey, userLanguage),
          preview: tVar('email.fileUpload.preview' as TranslationKey, userLanguage, {
            uploader: payload.data.uploaderName,
            fileName: payload.data.fileName,
            transaction: translatedTransactionTitle,
          }),
          uploadedFile: t('email.fileUpload.uploadedFile' as TranslationKey, userLanguage),
          viewDashboard: t('email.fileUpload.viewDashboard' as TranslationKey, userLanguage),
          footer: t('email.fileUpload.footer' as TranslationKey, userLanguage),
        },
      });
    }

    if (!emailComponent) return;

    try {
      await resend.emails.send({
        from: emailFrom,
        to: recipientEmail,
        subject: emailSubject,
        react: emailComponent,
      });
      logger.info('[Email] Sent', { userId: profile.id });
    } catch (sendError) {
      logger.error('[Email] Failed to send', {
        userId: profile.id,
        error: sendError instanceof Error ? sendError.message : String(sendError),
      });
    }
  };

  // SMS and email for the same recipient are independent — run concurrently
  await Promise.all([sendSms(), sendEmail()]);
}
