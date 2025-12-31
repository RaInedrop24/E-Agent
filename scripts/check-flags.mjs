import { chromium } from '@playwright/test';

async function checkFlags() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    // Wait a bit for everything to load
    await page.waitForTimeout(2000);

    // Take a screenshot
    await page.screenshot({ path: 'landing-page-flags.png', fullPage: true });
    console.log('Screenshot saved to landing-page-flags.png');

    // Check if flags are visible in the DOM
    const flagSelector = page.locator('text=/🇬🇧|🇮🇹|🇪🇸|🇫🇷|🇩🇪|🇵🇱|🇳🇱/');
    const flagCount = await flagSelector.count();
    console.log(`Found ${flagCount} flag emoji(s) in the page`);

    // Check for the FlagLanguageSelector component
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} button(s) on the page`);

    // Print button text content
    for (let i = 0; i < Math.min(buttons.length, 20); i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i + 1}: "${text}"`);
    }

    // Wait for user to see the page
    console.log('\nPage is open. Press Ctrl+C to close when done inspecting...');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkFlags();
