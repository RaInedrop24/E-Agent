// Email service using Resend (matching existing notification setup)
// Docs: https://resend.com/docs/send-with-nodejs

import { Resend } from 'resend';
import { generateBuyerWelcomeEmail, generateBuyerConnectionEmail } from './email-templates';

type Language = 'en' | 'it' | 'pl' | 'es' | 'fr' | 'nl' | 'de';

interface SendBuyerWelcomeEmailParams {
  to: string;
  fullName: string;
  password: string;
  language: Language;
  agentName: string;
  agentLogoUrl?: string | null;
  agentPrimaryColor?: string;
}

interface SendBuyerConnectionEmailParams {
  to: string;
  buyerName: string;
  agentName: string;
  agentEmail: string;
  language: Language;
  agentLogoUrl?: string | null;
  agentPrimaryColor?: string;
}

export async function sendBuyerWelcomeEmail(params: SendBuyerWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured - RESEND_API_KEY missing' };
    }

    // Initialize Resend client
    const resend = new Resend(apiKey);
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com'}/login`;

    // Generate multilingual email template
    // Note: Using separate variable declarations instead of destructuring to avoid scope issues
    let subject, html;
    try {
      const result = generateBuyerWelcomeEmail({
        fullName: params.fullName,
        email: params.to,
        password: params.password,
        loginUrl,
        language: params.language,
        agentName: params.agentName,
        agentLogoUrl: params.agentLogoUrl,
        agentPrimaryColor: params.agentPrimaryColor,
      });
      subject = result.subject;
      html = result.html;
    } catch (templateError: any) {
      console.error('[Email Service] Template generation failed:', templateError.message);
      throw templateError;
    }

    console.log('[Email Service] Sending welcome email to', params.to);

    // Send email via Resend (matching existing notification pattern)
    const emailFrom = 'Welcome <Welcome@mail.thepropertygateway.com>';
    
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: params.to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email Service] Failed to send email:', error.message, { to: params.to });
      return { 
        success: false, 
        error: error.message || 'Failed to send email' 
      };
    }

    console.log('[Email Service] ✓ Email sent successfully to', params.to);
    return { success: true };
    
  } catch (error: any) {
    console.error('[Email Service] Unexpected error:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

/**
 * Send connection notification to existing buyer when added by new agent
 */
export async function sendBuyerConnectionEmail(params: SendBuyerConnectionEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured - RESEND_API_KEY missing' };
    }

    const resend = new Resend(apiKey);
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://thepropertygateway.com'}/login`;

    // Generate multilingual connection email
    let subject, html;
    try {
      const result = generateBuyerConnectionEmail({
        buyerName: params.buyerName,
        agentName: params.agentName,
        agentEmail: params.agentEmail,
        loginUrl,
        language: params.language,
        agentLogoUrl: params.agentLogoUrl,
        agentPrimaryColor: params.agentPrimaryColor,
      });
      subject = result.subject;
      html = result.html;
    } catch (templateError: any) {
      console.error('[Email Service] Connection template generation failed:', templateError.message);
      throw templateError;
    }

    console.log('[Email Service] Sending connection notification to', params.to);

    // Send email via Resend
    const emailFrom = 'The Property Gateway <notifications@mail.thepropertygateway.com>';
    
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: params.to,
      subject,
      html,
    });

    if (error) {
      console.error('[Email Service] Failed to send connection email:', error.message, { to: params.to });
      return { 
        success: false, 
        error: error.message || 'Failed to send email' 
      };
    }

    console.log('[Email Service] ✓ Connection notification sent successfully to', params.to);
    return { success: true };
    
  } catch (error: any) {
    console.error('[Email Service] Unexpected error sending connection email:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

