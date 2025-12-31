#!/usr/bin/env node

/**
 * Translate missing Polish keys for agent-focused landing page
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEEPL_API_KEY = process.env.DEEPL_API_KEY || '97a5a999-5812-4066-a950-7a833011475c:fx';

const missingTexts = [
  "'landing.agentHeroTitle': 'Win More Overseas Buyers with Seamless Communication'",
  "'landing.agentHeroSubtitle': 'The Complete Transaction Portal for International Estate Agents'",
  "'landing.agentHeroDescription': 'As overseas buyers invest in international property markets, stand out with a professional platform that eliminates language barriers, builds trust, and closes deals faster.'",
  "'landing.agentProblemTitle': 'The Overseas Buyer Challenge'",
  "'landing.agentProblemDesc': 'Overseas buyers are investing heavily in international real estate, but language barriers and complex transaction processes create friction. Traditional methods lead to misunderstandings, delays, and lost deals.'",
  "'landing.agentSolutionTitle': 'Your Competitive Advantage'",
  "'landing.agentSolutionDesc': 'The Property Gateway gives you everything you need to serve overseas buyers professionally: real-time translation, transparent progress tracking, and centralized communication that builds confidence and closes deals.'",
  "'landing.agentCtaTitle': 'Start Your Free Trial Today'",
  "'landing.agentCtaDescription': 'Join forward-thinking estate agents worldwide who are winning more overseas buyers with The Property Gateway. No credit card required.'",
  "'landing.agentCtaButton': 'Start Free Trial'",
  "'landing.agentCtaSecondary': 'See How It Works'",
  "'landing.agentBenefitsTitle': 'Why Estate Agents Choose Us'",
  "'landing.agentBenefit1Title': 'Close Deals Faster'",
  "'landing.agentBenefit1Desc': 'Reduce transaction time by up to 40% with automated progress tracking and instant communication'",
  "'landing.agentBenefit2Title': 'Build Buyer Trust'",
  "'landing.agentBenefit2Desc': 'Transparency and real-time updates eliminate buyer anxiety and build confidence in your service'",
  "'landing.agentBenefit3Title': 'Stand Out from Competitors'",
  "'landing.agentBenefit3Desc': 'Professional portal with your branding shows you\\'re modern, organized, and buyer-focused'",
  "'landing.agentBenefit4Title': 'Save Time & Reduce Errors'",
  "'landing.agentBenefit4Desc': 'Centralized communication means no more lost emails, missed messages, or translation mistakes'",
  "'landing.useCase1Title': 'Seamless Buyer Onboarding'",
  "'landing.useCase1Desc': 'Invite overseas buyers to your branded portal with one click. They see their transaction progress in real-time, in their preferred language, building immediate trust.'",
  "'landing.useCase2Title': 'Real-Time Progress Updates'",
  "'landing.useCase2Desc': 'Update milestones as your transaction progresses. Buyers see exactly where they are in the process, reducing anxiety and support calls.'",
  "'landing.useCase3Title': 'Automatic Translation'",
  "'landing.useCase3Desc': 'Communicate in your language, buyers read in theirs. DeepL-powered translation ensures nothing gets lost in translation.'",
  "'landing.useCase4Title': 'Document Management'",
  "'landing.useCase4Desc': 'All contracts, certificates, and documents in one secure location. No more email chains or lost files.'",
  "'landing.useCase5Title': 'Professional Branding'",
  "'landing.useCase5Desc': 'Your agency logo and colors throughout the portal. Buyers see your brand, not a generic platform.'",
  "'landing.useCase6Title': 'Multi-Transaction Management'",
  "'landing.useCase6Desc': 'Manage all your overseas buyer transactions from one dashboard. Track progress, send updates, and never miss a deadline.'",
  "'landing.featuresShowcaseTitle': 'Everything You Need to Serve Overseas Buyers'",
  "'landing.featuresShowcaseSubtitle': 'A complete platform designed specifically for international real estate transactions'",
];

// Extract just the text values
const textsToTranslate = missingTexts.map(line => {
  const match = line.match(/:\s*'(.+)'$/);
  return match ? match[1].replace(/\\'/g, "'") : '';
}).filter(Boolean);

console.log(`Translating ${textsToTranslate.length} missing Polish keys...\n`);

async function translateBatch(texts, targetLang = 'PL') {
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texts,
      target_lang: targetLang,
      source_lang: 'EN',
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepL API error: ${response.status} - ${await response.text()}`);
  }

  const result = await response.json();
  return result.translations.map(t => t.text);
}

const translated = await translateBatch(textsToTranslate);

// Build output
let output = '    // Agent-focused landing page content (Polish)\n';
missingTexts.forEach((line, index) => {
  const key = line.match(/'([^']+)':/)[1];
  const translatedText = translated[index].replace(/'/g, "\\'");
  output += `    '${key}': '${translatedText}',\n`;
});

console.log(output);

writeFileSync(join(__dirname, 'polish-missing-translations.txt'), output, 'utf-8');
console.log('\n✅ Translations saved to polish-missing-translations.txt');
