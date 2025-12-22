import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { TransactionProgressEmail } from '@/components/emails/TransactionProgressEmail';
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

    // Extract branding
    const agentProfile = tx.profiles as any;
    const brandLogoUrl = agentProfile?.branding_logo_url;
    // branding_settings might be null or json
    const brandSettings = agentProfile?.branding_settings; 
    const brandColor = brandSettings?.primary;

    // Fetch all data
    const [milestonesRes, messagesRes, filesRes] = await Promise.all([
      supabaseAdmin.from('milestones').select('*').eq('transaction_id', transactionId).order('order_index'),
      supabaseAdmin.from('messages').select('*, profiles!messages_author_profile_id_fkey(full_name)').eq('transaction_id', transactionId).order('created_at'),
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

    // Prepare email data
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com';
    const transactionUrl = `${siteUrl}/transaction/${transactionId}`;

    const emailProps = {
      transactionTitle: tx.title_en || tx.title || 'Untitled Transaction',
      propertyAddress: tx.property_address,
      propertyUrl: tx.property_url,
      milestones: milestones.map(m => ({
        label: m.label_en || m.label_it || 'Milestone',
        completed: m.completed,
        completedAt: m.completed_at,
      })),
      messages: messages.map(m => ({
        author: (m.profiles as any)?.full_name || 'Unknown',
        content: m.content_original,
        createdAt: m.created_at,
      })),
      files: files.map(f => ({
        name: f.file_name,
        size: formatBytes(f.file_size || 0),
      })),
      siteUrl,
      transactionUrl,
      brandLogoUrl,
      brandColor,
    };

    // Send email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'The Property Gateway <noreply@mail.thepropertygateway.com>',
      to: [user.email!],
      subject: `Transaction Progress: ${emailProps.transactionTitle}`,
      react: React.createElement(TransactionProgressEmail, emailProps) as React.ReactElement,
      attachments: validAttachments,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: emailData?.id });

  } catch (error: any) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
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
