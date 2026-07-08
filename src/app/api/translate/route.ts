/**
 * Translation API Route
 * POST /api/translate
 *
 * Requires an authenticated session. The DeepL quota is a paid/limited
 * resource, so anonymous access is rejected.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch } from '@/lib/translation';
import { AUTH_COOKIE_NAME, LANGUAGE_CODES, isSupportedLanguage } from '@/lib/constants';
import { logger } from '@/lib/logger';

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

/**
 * Resolve the caller's access token from either the Authorization header
 * or the session cookie written by AuthContext.
 */
function getAccessToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieValue) {
    try {
      const parsed = JSON.parse(cookieValue);
      if (typeof parsed?.access_token === 'string') {
        return parsed.access_token;
      }
    } catch {
      // Malformed cookie — treat as unauthenticated
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the caller before spending DeepL quota
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, texts, targetLang, sourceLang } = body;

    // Validate required fields
    if (!targetLang) {
      return NextResponse.json(
        { error: 'targetLang is required' },
        { status: 400 }
      );
    }

    // Validate language codes against the canonical supported list
    if (!isSupportedLanguage(targetLang)) {
      return NextResponse.json(
        { error: `Invalid target language. Must be one of: ${LANGUAGE_CODES.join(', ')}` },
        { status: 400 }
      );
    }

    if (sourceLang && !isSupportedLanguage(sourceLang)) {
      return NextResponse.json(
        { error: `Invalid source language. Must be one of: ${LANGUAGE_CODES.join(', ')}` },
        { status: 400 }
      );
    }

    // Handle batch translation
    if (texts && Array.isArray(texts)) {
      if (texts.length === 0) {
        return NextResponse.json(
          { error: 'texts array cannot be empty' },
          { status: 400 }
        );
      }

      const results = await translateBatch(texts, targetLang, sourceLang);
      return NextResponse.json({ results });
    }

    // Handle single translation
    if (text) {
      if (typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json(
          { error: 'text must be a non-empty string' },
          { status: 400 }
        );
      }

      const result = await translateText(text, targetLang, sourceLang);
      return NextResponse.json(result);
    }

    // No text or texts provided
    return NextResponse.json(
      { error: 'Either text or texts must be provided' },
      { status: 400 }
    );

  } catch (error) {
    logger.exception('Translation API error', error instanceof Error ? error : new Error(String(error)));

    const errorMessage = error instanceof Error ? error.message : 'Translation failed';

    return NextResponse.json(
      {
        error: 'Translation failed',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
