/**
 * Translation API Route
 * POST /api/translate
 */

import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch, SupportedLanguage } from '@/lib/translation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, targetLang, sourceLang } = body;

    // Validate required fields
    if (!targetLang) {
      return NextResponse.json(
        { error: 'targetLang is required' },
        { status: 400 }
      );
    }

    // Validate language code
    const validLanguages: SupportedLanguage[] = ['en', 'it', 'es', 'fr', 'de', 'pl'];
    if (!validLanguages.includes(targetLang)) {
      return NextResponse.json(
        { error: `Invalid target language. Must be one of: ${validLanguages.join(', ')}` },
        { status: 400 }
      );
    }

    if (sourceLang && !validLanguages.includes(sourceLang)) {
      return NextResponse.json(
        { error: `Invalid source language. Must be one of: ${validLanguages.join(', ')}` },
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
    console.error('Translation API error:', error);
    
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

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    message: 'Translation API',
    endpoint: '/api/translate',
    method: 'POST',
    body: {
      text: 'Text to translate (string)',
      texts: 'Multiple texts to translate (array of strings)',
      targetLang: 'Target language code (en, it, es, fr, de)',
      sourceLang: 'Optional source language code'
    }
  });
}

