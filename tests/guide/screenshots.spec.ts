/**
 * User Guide Screenshot Capture Test
 *
 * Captures screenshots for the user guide documentation across all 6 supported languages.
 * Screenshots are saved to docs/user-guide/images/{lang}/ directories.
 *
 * Usage:
 *   npm run guide:screenshots        # Run all languages
 *   npm run guide:screenshots:en     # Run English only
 */

import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// All 6 supported languages
const LANGUAGES = ['en', 'it', 'es', 'fr', 'de', 'pl'] as const;
type Language = typeof LANGUAGES[number];

// Test credentials (set via environment or use defaults for guide capture)
const AGENT_EMAIL = process.env.TEST_AGENT_EMAIL || 'guide-agent@example.com';
const AGENT_PASSWORD = process.env.TEST_AGENT_PASSWORD || 'GuideTest123!';

// Screenshot configuration
const SCREENSHOT_CONFIG = {
  fullPage: false,
  animations: 'disabled' as const,
};

// Viewport for consistent screenshots
const VIEWPORT = { width: 1280, height: 800 };

/**
 * Helper to set the language preference
 */
async function setLanguage(page: Page, lang: Language): Promise<void> {
  await page.evaluate((l) => {
    localStorage.setItem('preferred_language', l);
  }, lang);
}

/**
 * Helper to capture screenshot with consistent naming
 */
async function captureScreenshot(
  page: Page,
  lang: Language,
  section: string,
  name: string
): Promise<void> {
  const path = `docs/user-guide/images/${lang}/${section}-${name}.png`;
  await page.screenshot({
    ...SCREENSHOT_CONFIG,
    path,
  });
  console.log(`  ✓ Captured: ${path}`);
}

/**
 * Helper to highlight an element for the screenshot
 */
async function highlightElement(page: Page, selector: string): Promise<void> {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      (el as HTMLElement).style.outline = '3px solid #ef4444';
      (el as HTMLElement).style.outlineOffset = '2px';
    }
  }, selector);
}

/**
 * Helper to remove highlight
 */
async function removeHighlight(page: Page, selector: string): Promise<void> {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.outlineOffset = '';
    }
  }, selector);
}

/**
 * Login helper
 */
async function loginAsAgent(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(AGENT_EMAIL, AGENT_PASSWORD);

  // Wait for dashboard to load
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await expect(page.getByRole('button', { name: /Logout|Esci/i })).toBeVisible({ timeout: 10000 });
}

// Generate tests for each language
for (const lang of LANGUAGES) {
  test.describe(`${lang.toUpperCase()} Screenshots`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORT);
    });

    test('01 - Registration Flow', async ({ page }) => {
      console.log(`\n📸 Capturing Registration screenshots (${lang})...`);

      // Go to register page and set language
      await page.goto('/register');
      await setLanguage(page, lang);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Empty registration form
      await captureScreenshot(page, lang, '01', 'register-empty');

      // Fill the form
      await page.getByLabel(/Full Name|Nome|Nombre|Nom|Vollständiger Name|Imię/i).fill('Marco Rossi');
      await page.getByLabel(/Email/i).fill('new.agent@example.com');
      await page.getByLabel(/Password/i).fill('SecurePassword123!');

      // Select Agent role
      await page.getByText(/Estate Agent|Agente|Agente Inmobiliario|Agent Immobilier|Immobilienmakler|Agent/i).click();

      await captureScreenshot(page, lang, '01', 'register-filled');

      // Highlight the role selector
      await highlightElement(page, '[data-slot="radio-group"]');
      await captureScreenshot(page, lang, '01', 'register-role-highlight');
      await removeHighlight(page, '[data-slot="radio-group"]');
    });

    test('02 - Login Flow', async ({ page }) => {
      console.log(`\n📸 Capturing Login screenshots (${lang})...`);

      await page.goto('/login');
      await setLanguage(page, lang);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Empty login form
      await captureScreenshot(page, lang, '02', 'login-empty');

      // Filled form
      await page.getByLabel(/Email/i).fill('agent@example.com');
      await page.getByLabel(/Password/i).fill('password123');

      await captureScreenshot(page, lang, '02', 'login-filled');
    });

    test('03 - Dashboard Overview', async ({ page }) => {
      console.log(`\n📸 Capturing Dashboard screenshots (${lang})...`);

      // Login first
      await loginAsAgent(page);
      await setLanguage(page, lang);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Full dashboard view
      await captureScreenshot(page, lang, '03', 'dashboard-full');

      // Highlight transactions list
      const transactionsList = page.locator('[data-slot="card"]').first();
      if (await transactionsList.isVisible()) {
        await highlightElement(page, '[data-slot="card"]:first-child');
        await captureScreenshot(page, lang, '03', 'dashboard-transactions-highlight');
        await removeHighlight(page, '[data-slot="card"]:first-child');
      }

      // Highlight recent activity
      const activityCard = page.locator('[data-slot="card"]').nth(1);
      if (await activityCard.isVisible()) {
        await captureScreenshot(page, lang, '03', 'dashboard-activity');
      }
    });

    test('04 - Settings & Branding', async ({ page }) => {
      console.log(`\n📸 Capturing Settings screenshots (${lang})...`);

      await loginAsAgent(page);
      await setLanguage(page, lang);

      // Navigate to settings
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Full settings page
      await captureScreenshot(page, lang, '04', 'settings-full');

      // Branding section (if visible)
      const brandingSection = page.locator('text=Branding').first();
      if (await brandingSection.isVisible()) {
        await brandingSection.scrollIntoViewIfNeeded();
        await captureScreenshot(page, lang, '04', 'settings-branding');
      }

      // Color picker section
      const colorSection = page.locator('[data-testid="color-picker"]').first();
      if (await colorSection.isVisible()) {
        await captureScreenshot(page, lang, '04', 'settings-colors');
      }
    });

    test('05 - Create Transaction', async ({ page }) => {
      console.log(`\n📸 Capturing Create Transaction screenshots (${lang})...`);

      await loginAsAgent(page);
      await setLanguage(page, lang);

      await page.goto('/transactions/create');
      await page.waitForLoadState('networkidle');

      // Empty form
      await captureScreenshot(page, lang, '05', 'create-transaction-empty');

      // Fill form
      await page.getByLabel(/Transaction Title|Titolo|Título|Titre|Titel/i).fill('Villa Toscana');
      await page.getByLabel(/Property Address|Indirizzo|Dirección|Adresse|Adres/i).fill('Via dei Giardini 42, Firenze');

      // Optional: fill agent reference if visible
      const refField = page.getByLabel(/Reference|Riferimento|Referencia|Référence|Referenz/i);
      if (await refField.isVisible()) {
        await refField.fill('FI-2024-001');
      }

      await captureScreenshot(page, lang, '05', 'create-transaction-filled');

      // Highlight the "What happens next" section
      const nextSection = page.locator('text=What happens next').first();
      if (await nextSection.isVisible()) {
        await nextSection.scrollIntoViewIfNeeded();
        await captureScreenshot(page, lang, '05', 'create-transaction-next-steps');
      }
    });

    test('06 - Transaction Detail', async ({ page }) => {
      console.log(`\n📸 Capturing Transaction Detail screenshots (${lang})...`);

      await loginAsAgent(page);
      await setLanguage(page, lang);

      // Go to transactions list first
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');

      // Click on first transaction if available
      const transactionLink = page.locator('a[href*="/transaction/"]').first();
      if (await transactionLink.isVisible()) {
        await transactionLink.click();
        await page.waitForLoadState('networkidle');

        // Full transaction detail
        await captureScreenshot(page, lang, '06', 'transaction-detail-full');

        // Milestones tab
        const milestonesTab = page.getByRole('tab', { name: /Milestones|Tappe|Hitos|Étapes|Meilensteine/i });
        if (await milestonesTab.isVisible()) {
          await milestonesTab.click();
          await page.waitForTimeout(500);
          await captureScreenshot(page, lang, '06', 'transaction-milestones');
        }

        // Messages tab
        const messagesTab = page.getByRole('tab', { name: /Messages|Messaggi|Mensajes|Messages|Nachrichten/i });
        if (await messagesTab.isVisible()) {
          await messagesTab.click();
          await page.waitForTimeout(500);
          await captureScreenshot(page, lang, '06', 'transaction-messages');
        }

        // Files tab
        const filesTab = page.getByRole('tab', { name: /Files|File|Archivos|Fichiers|Dateien/i });
        if (await filesTab.isVisible()) {
          await filesTab.click();
          await page.waitForTimeout(500);
          await captureScreenshot(page, lang, '06', 'transaction-files');
        }
      }
    });

    test('07 - Manage Buyers', async ({ page }) => {
      console.log(`\n📸 Capturing Manage Buyers screenshots (${lang})...`);

      await loginAsAgent(page);
      await setLanguage(page, lang);

      // Navigate to buyers page if it exists
      await page.goto('/buyers');

      // Check if page loaded or redirected
      if (page.url().includes('/buyers')) {
        await page.waitForLoadState('networkidle');
        await captureScreenshot(page, lang, '07', 'buyers-list');

        // Click create buyer button if available
        const createButton = page.getByRole('button', { name: /Create|Crea|Crear|Créer|Erstellen/i });
        if (await createButton.isVisible()) {
          await createButton.click();
          await page.waitForTimeout(500);
          await captureScreenshot(page, lang, '07', 'buyers-create-modal');
        }
      }
    });

    test('08 - Milestone Templates', async ({ page }) => {
      console.log(`\n📸 Capturing Milestone Templates screenshots (${lang})...`);

      await loginAsAgent(page);
      await setLanguage(page, lang);

      // Navigate to milestone templates page if it exists
      await page.goto('/milestone-templates');

      if (page.url().includes('/milestone-templates')) {
        await page.waitForLoadState('networkidle');
        await captureScreenshot(page, lang, '08', 'milestone-templates-list');

        // Click on first template to show editor
        const templateItem = page.locator('[data-testid="template-item"]').first();
        if (await templateItem.isVisible()) {
          await templateItem.click();
          await page.waitForTimeout(500);
          await captureScreenshot(page, lang, '08', 'milestone-templates-editor');
        }
      }
    });
  });
}

// Single language test for quick iteration
test.describe('Quick Screenshot Test (English only)', () => {
  test.skip(process.env.FULL_GUIDE_CAPTURE === 'true', 'Skipped when running full capture');

  test('Capture key screens', async ({ page }) => {
    await page.setViewportSize(VIEWPORT);

    // Registration
    await page.goto('/register');
    await captureScreenshot(page, 'en', '01', 'register-quick');

    // Login
    await page.goto('/login');
    await captureScreenshot(page, 'en', '02', 'login-quick');
  });
});
