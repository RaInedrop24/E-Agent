import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    console.log('[TEST SMS] Starting SMS test...');
    console.log('[TEST SMS] Phone Number:', phoneNumber);
    console.log('[TEST SMS] Message:', message);
    console.log('[TEST SMS] Twilio SID:', process.env.TWILIO_SID ? 'Present' : 'MISSING');
    console.log('[TEST SMS] Twilio Secret:', process.env.TWILIO_SECRET ? 'Present' : 'MISSING');
    console.log('[TEST SMS] Twilio Phone:', process.env.TWILIO_PHONE_NUMBER);

    if (!process.env.TWILIO_SID || !process.env.TWILIO_SECRET) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 500 }
      );
    }

    const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_SECRET);
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER || 'PROPERTY';

    console.log('[TEST SMS] Attempting to send via Twilio...');

    const result = await twilioClient.messages.create({
      body: message || 'Test message from Property Gateway',
      from: twilioFrom,
      to: phoneNumber,
    });

    console.log('[TEST SMS] Success! Message SID:', result.sid);
    console.log('[TEST SMS] Status:', result.status);

    return NextResponse.json({
      success: true,
      sid: result.sid,
      status: result.status,
      message: 'SMS sent successfully',
    });
  } catch (error: any) {
    console.error('[TEST SMS] ERROR:', error);
    console.error('[TEST SMS] Error message:', error.message);
    console.error('[TEST SMS] Error code:', error.code);
    console.error('[TEST SMS] Error status:', error.status);
    console.error('[TEST SMS] Full error:', JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        error: error.message || 'Failed to send SMS',
        code: error.code,
        status: error.status,
        details: error.moreInfo,
      },
      { status: 500 }
    );
  }
}
