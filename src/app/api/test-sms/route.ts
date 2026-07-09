/**
 * Debug endpoint: sends a test SMS via Twilio.
 * Spends Twilio credit, so it is restricted to super admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getAuthenticatedUser, isSuperAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await isSuperAdmin(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { phoneNumber, message } = await request.json();

    if (typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }

    if (!process.env.TWILIO_SID || !process.env.TWILIO_SECRET) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      );
    }

    const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_SECRET);
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER || 'PROPERTY';

    logger.debug('[TEST SMS] Sending test SMS', { phoneNumber });

    const result = await twilioClient.messages.create({
      body: message || 'Test message from Property Gateway',
      from: twilioFrom,
      to: phoneNumber,
    });

    logger.info('[TEST SMS] Sent', { sid: result.sid, status: result.status });

    return NextResponse.json({
      success: true,
      sid: result.sid,
      status: result.status,
      message: 'SMS sent successfully',
    });
  } catch (error) {
    const err = error as { message?: string; code?: string; status?: number; moreInfo?: string };
    logger.exception('[TEST SMS] Error', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        error: err.message || 'Failed to send SMS',
        code: err.code,
        status: err.status,
        details: err.moreInfo,
      },
      { status: 500 }
    );
  }
}
