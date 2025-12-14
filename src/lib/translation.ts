/**
 * Translation Service
 * Handles all translation operations using DeepL API
 */

export type SupportedLanguage = 'en' | 'it' | 'es' | 'fr' | 'de';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  detectedSourceLang?: string;
}

export interface TranslationError {
  error: string;
  code?: string;
  details?: string;
}

/**
 * Map our language codes to DeepL's expected format
 */
function mapToDeepLLanguage(lang: SupportedLanguage): string {
  const mapping: Record<SupportedLanguage, string> = {
    en: 'EN',
    it: 'IT',
    es: 'ES',
    fr: 'FR',
    de: 'DE',
  };
  return mapping[lang] || 'EN';
}

/**
 * Translate text using DeepL API
 */
export async function translateText(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<TranslationResult> {
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text to translate cannot be empty');
  }

  try {
    const requestBody: any = {
      text: [text],
      target_lang: mapToDeepLLanguage(targetLang),
    };

    // Only add source_lang if specified
    if (sourceLang) {
      requestBody.source_lang = mapToDeepLLanguage(sourceLang);
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const translation = result.translations[0];

    return {
      originalText: text,
      translatedText: translation.text,
      sourceLang: sourceLang || translation.detected_source_language.toLowerCase(),
      targetLang: targetLang,
      detectedSourceLang: translation.detected_source_language,
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(
  texts: string[],
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<TranslationResult[]> {
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured');
  }

  if (!texts || texts.length === 0) {
    return [];
  }

  try {
    const requestBody: any = {
      text: texts,
      target_lang: mapToDeepLLanguage(targetLang),
    };

    if (sourceLang) {
      requestBody.source_lang = mapToDeepLLanguage(sourceLang);
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepL API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return result.translations.map((translation: any, index: number) => ({
      originalText: texts[index],
      translatedText: translation.text,
      sourceLang: sourceLang || translation.detected_source_language.toLowerCase(),
      targetLang: targetLang,
      detectedSourceLang: translation.detected_source_language,
    }));
  } catch (error) {
    console.error('Batch translation error:', error);
    throw error;
  }
}

/**
 * Get DeepL API usage statistics
 */
export async function getUsageStats(): Promise<{
  characterCount: number;
  characterLimit: number;
  remaining: number;
}> {
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured');
  }

  try {
    const response = await fetch('https://api-free.deepl.com/v2/usage', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const usage = await response.json();

    return {
      characterCount: usage.character_count,
      characterLimit: usage.character_limit,
      remaining: usage.character_limit - usage.character_count,
    };
  } catch (error) {
    console.error('Usage stats error:', error);
    throw error;
  }
}

/**
 * Detect the language of a text
 */
export async function detectLanguage(text: string): Promise<string> {
  // DeepL doesn't have a dedicated detection endpoint,
  // but we can translate to English and check the detected_source_language
  try {
    const result = await translateText(text, 'en');
    return result.detectedSourceLang?.toLowerCase() || 'unknown';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'unknown';
  }
}

