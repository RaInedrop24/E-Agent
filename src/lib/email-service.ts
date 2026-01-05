// Email service using Resend (matching existing notification setup)
// Docs: https://resend.com/docs/send-with-nodejs

import { Resend } from 'resend';
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
    // Check for API key and log detailed info
    const apiKey = process.env.RESEND_API_KEY;
    console.log('[Email Service] API Key check:', {
      exists: !!apiKey,
      keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING',
      envKeys: Object.keys(process.env).filter(k => k.includes('RESEND')),
    });

    if (!apiKey) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured - RESEND_API_KEY missing' };
    }

    // Initialize Resend client with API key
    const resend = new Resend(apiKey);

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

    // Send email via Resend (matching existing notification pattern)
    const emailFrom = 'Welcome <Welcome@mail.thepropertygateway.com>';
    
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: params.to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email Service] Failed to send email', { 
        error,
        errorMessage: error.message,
        errorName: error.name,
        fullError: JSON.stringify(error, null, 2),
        to: params.to,
        from: emailFrom,
      });
      return { 
        success: false, 
        error: `${error.name || 'Error'}: ${error.message || 'Failed to send email'}` 
      };
    }

    console.log('[Email Service] Email sent successfully', { 
      id: data?.id,
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

