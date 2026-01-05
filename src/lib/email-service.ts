// Email service using Resend API
// Docs: https://resend.com/docs/send-with-nodejs

import { generateBuyerWelcomeEmail } from './email-templates';

type Language = 'en' | 'it' | 'pl' | 'es' | 'fr' | 'nl' | 'de';

interface SendBuyerWelcomeEmailParams {
  to: string;
  fullName: string;
  password: string;
  language: Language;
}

export async function sendBuyerWelcomeEmail(params: SendBuyerWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com'}/login`;

    // Generate multilingual email
    const { subject, html } = generateBuyerWelcomeEmail({
      fullName: params.fullName,
      email: params.to,
      password: params.password,
      loginUrl,
      language: params.language,
    });

    console.log('[Email Service] Sending welcome email', { 
      to: params.to, 
      language: params.language,
      subject,
    });

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'The Property Gateway <noreply@thepropertygateway.com>',
        to: params.to,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Email Service] Failed to send email', { 
        status: response.status, 
        error: data 
      });
      return { 
        success: false, 
        error: data.message || 'Failed to send email' 
      };
    }

    console.log('[Email Service] Email sent successfully', { 
      id: data.id,
      to: params.to,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Email Service] Error sending email:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

