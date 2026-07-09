import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { TransactionProgressEmail } from '@/components/emails/TransactionProgressEmail';
import * as React from 'react';
import { t, tVar, type TranslationKey } from '@/lib/ui-translations';
import { SupportedLanguage, translateText } from '@/lib/translation';
import { SITE_URL } from '@/lib/constants';

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params;
    
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

    // Get user's profile to determine preferred language
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('preferred_language')
      .eq('id', user.id)
      .single();

    const userLanguage: SupportedLanguage = (userProfile?.preferred_language as SupportedLanguage) || 'en';

    // Check if user is a participant or creator
    const { data: tx, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*, profiles!transactions_created_by_fkey(full_name, branding_logo_url, branding_settings)')
      .eq('id', transactionId)
      .single();

    if (txError || !tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const isCreator = tx.created_by === user.id;
    const { data: participant } = await supabaseAdmin
      .from('transaction_participants')
      .select('id')
      .eq('transaction_id', transactionId)
      .eq('profile_id', user.id)
      .single();

    if (!isCreator && !participant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract branding; shape matches the profiles join in the .select() above
    const agentProfile = tx.profiles as {
      full_name: string | null;
      branding_logo_url: string | null;
      branding_settings: { primary?: string } | null;
    } | null;
    const brandLogoUrl = agentProfile?.branding_logo_url;
    // branding_settings might be null or json
    const brandSettings = agentProfile?.branding_settings; 
    const brandColor = brandSettings?.primary;

    // Fetch all data
    const [milestonesRes, messagesRes, filesRes] = await Promise.all([
      supabaseAdmin.from('milestones').select('*').eq('transaction_id', transactionId).order('order_index'),
      supabaseAdmin.from('messages').select('*, profiles!messages_author_profile_id_fkey(full_name)').eq('transaction_id', transactionId).order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('files').select('*').eq('transaction_id', transactionId),
    ]);

    const milestones = milestonesRes.data || [];
    const messages = messagesRes.data || [];
    const files = filesRes.data || [];

    // Download files for attachments
    const attachments = await Promise.all(
      files.map(async (file) => {
        try {
          const { data, error } = await supabaseAdmin.storage
            .from('transaction_files')
            .download(file.storage_path);
          
          if (error) {
            console.error(`Error downloading file ${file.file_name}:`, error);
            return null;
          }

          const arrayBuffer = await data.arrayBuffer();
          return {
            filename: file.file_name,
            content: Buffer.from(arrayBuffer),
          };
        } catch (err) {
          console.error(`Unexpected error downloading file ${file.file_name}:`, err);
          return null;
        }
      })
    );

    const validAttachments = attachments.filter(a => a !== null) as Array<{ filename: string; content: Buffer }>;

    // Get translated transaction title
    const langKey = `title_${userLanguage}` as keyof typeof tx;
    const transactionTitle = (tx[langKey] as string) || tx.title_en || tx.title || 'Untitled Transaction';

    // Get translated milestone labels
    const translatedMilestones = milestones.map(m => {
      const milestoneLangKey = `label_${userLanguage}` as keyof typeof m;
      const label = (m[milestoneLangKey] as string) || m.label_en || m.label_it || 'Milestone';
      return {
        label,
        completed: m.completed,
        completedAt: m.completed_at,
      };
    });

    // Reverse messages to show oldest first (typical email thread order)
    const reversedMessages = [...messages].reverse();
    
    // Translate messages to user's language
    const translatedMessages = await Promise.all(
      reversedMessages.map(async (m) => {
        const originalContent = m.content_original;
        let translatedContent = originalContent;

        // Check if message needs translation (if it has translated_text cache)
        if (m.translated_text && typeof m.translated_text === 'object') {
          const cachedTranslation = (m.translated_text as Record<string, string>)[userLanguage];
          if (cachedTranslation) {
            translatedContent = cachedTranslation;
          } else {
            // Try to translate using DeepL
            try {
              const messageLanguage = m.original_language as SupportedLanguage || 'en';
              if (messageLanguage !== userLanguage) {
                const translation = await translateText(originalContent, userLanguage, messageLanguage);
                translatedContent = translation.translatedText;
              }
            } catch (error) {
              console.error('Error translating message:', error);
              // Fall back to original if translation fails
              translatedContent = originalContent;
            }
          }
        } else if (m.original_language && m.original_language !== userLanguage) {
          // Translate if original language differs from user language
          try {
            const translation = await translateText(originalContent, userLanguage, m.original_language as SupportedLanguage);
            translatedContent = translation.translatedText;
          } catch (error) {
            console.error('Error translating message:', error);
            translatedContent = originalContent;
          }
        }

        return {
          author: (m.profiles as { full_name?: string | null } | null)?.full_name || 'Unknown',
          content: translatedContent,
          createdAt: m.created_at,
        };
      })
    );

    // Prepare email data with translations
    const siteUrl = SITE_URL;
    const transactionUrl = `${siteUrl}/transaction/${transactionId}`;

    const emailProps = {
      transactionTitle,
      propertyAddress: tx.property_address,
      propertyUrl: tx.property_url,
      milestones: translatedMilestones,
      messages: translatedMessages,
      files: files.map(f => ({
        name: f.file_name,
        size: formatBytes(f.file_size || 0),
      })),
      siteUrl,
      transactionUrl,
      brandLogoUrl,
      brandColor,
      language: userLanguage,
      translations: {
        progressReport: t('email.progressReport' as TranslationKey, userLanguage),
        transactionProgressFor: tVar('email.transactionProgressFor' as TranslationKey, userLanguage, { title: transactionTitle }),
        viewPropertyListing: t('email.viewPropertyListing' as TranslationKey, userLanguage),
        milestones: t('email.milestones' as TranslationKey, userLanguage),
        completedOn: (date: string) => tVar('email.completedOn' as TranslationKey, userLanguage, { date }),
        recentMessages: t('email.recentMessages' as TranslationKey, userLanguage),
        noMessages: t('email.noMessages' as TranslationKey, userLanguage),
        files: t('email.files' as TranslationKey, userLanguage),
        noFiles: t('email.noFiles' as TranslationKey, userLanguage),
        attachmentNote: t('email.attachmentNote' as TranslationKey, userLanguage),
        viewTransaction: t('email.viewTransaction' as TranslationKey, userLanguage),
        viewDetails: t('email.viewDetails' as TranslationKey, userLanguage),
        sentFrom: t('email.sentFrom' as TranslationKey, userLanguage),
      },
    };

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'The Property Gateway <noreply@mail.thepropertygateway.com>',
      to: [user.email!],
      subject: emailProps.translations.transactionProgressFor,
      react: React.createElement(TransactionProgressEmail, emailProps) as React.ReactElement,
      attachments: validAttachments,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: emailData?.id });

  } catch (error) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : '') || 'Internal server error' }, { status: 500 });
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
