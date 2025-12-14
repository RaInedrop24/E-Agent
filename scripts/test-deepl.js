/**
 * Test script to verify DeepL API connectivity
 * Run with: node scripts/test-deepl.js
 */

const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.error('Error reading .env.local:', error.message);
  }
}

loadEnvFile();

async function testDeepLAPI() {
  const apiKey = process.env.DEEPL_API_KEY;
  
  if (!apiKey) {
    console.error('❌ DEEPL_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('✓ DeepL API key found');
  console.log('🔄 Testing DeepL API connectivity...\n');

  try {
    // Test 1: Check API usage/limits
    console.log('Test 1: Checking API usage...');
    const usageResponse = await fetch('https://api-free.deepl.com/v2/usage', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!usageResponse.ok) {
      throw new Error(`API usage check failed: ${usageResponse.status} ${usageResponse.statusText}`);
    }

    const usage = await usageResponse.json();
    console.log('✅ API connection successful!');
    console.log(`   Character usage: ${usage.character_count} / ${usage.character_limit}`);
    console.log(`   Remaining: ${usage.character_limit - usage.character_count} characters\n`);

    // Test 2: English to Italian translation
    console.log('Test 2: Translating English → Italian...');
    const testTextEN = 'Hello! Welcome to The Property Gateway. Your transaction is progressing well.';
    
    const translateResponse = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [testTextEN],
        target_lang: 'IT',
        source_lang: 'EN',
      }),
    });

    if (!translateResponse.ok) {
      throw new Error(`Translation failed: ${translateResponse.status} ${translateResponse.statusText}`);
    }

    const translateResult = await translateResponse.json();
    console.log('✅ Translation successful!');
    console.log(`   Original (EN): ${testTextEN}`);
    console.log(`   Translated (IT): ${translateResult.translations[0].text}\n`);

    // Test 3: Italian to English translation
    console.log('Test 3: Translating Italian → English...');
    const testTextIT = 'Ciao! Benvenuto a The Property Gateway. La tua transazione sta procedendo bene.';
    
    const translateResponse2 = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [testTextIT],
        target_lang: 'EN',
        source_lang: 'IT',
      }),
    });

    if (!translateResponse2.ok) {
      throw new Error(`Translation failed: ${translateResponse2.status} ${translateResponse2.statusText}`);
    }

    const translateResult2 = await translateResponse2.json();
    console.log('✅ Translation successful!');
    console.log(`   Original (IT): ${testTextIT}`);
    console.log(`   Translated (EN): ${translateResult2.translations[0].text}\n`);

    // Test 4: Get supported languages
    console.log('Test 4: Getting supported languages...');
    const langsResponse = await fetch('https://api-free.deepl.com/v2/languages?type=target', {
      method: 'GET',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
    });

    if (!langsResponse.ok) {
      throw new Error(`Languages check failed: ${langsResponse.status}`);
    }

    const languages = await langsResponse.json();
    const relevantLangs = languages.filter(l => ['EN', 'IT', 'ES', 'FR', 'DE'].includes(l.language));
    console.log('✅ Supported languages confirmed:');
    relevantLangs.forEach(lang => {
      console.log(`   - ${lang.language}: ${lang.name}`);
    });

    console.log('\n🎉 All DeepL API tests passed successfully!');
    console.log('✅ Ready to implement translation features\n');

  } catch (error) {
    console.error('\n❌ DeepL API test failed:');
    console.error(error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testDeepLAPI();

