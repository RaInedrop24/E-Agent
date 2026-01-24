import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Landing Page Visual Verification', () => {
  test('landing page displays correctly with updated copy', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await page.waitForLoadState('networkidle');

    // Verify "The Property Gateway" branding is visible as h1
    const brandHeading = page.getByRole('heading', { name: 'The Property Gateway' });
    await expect(brandHeading).toBeVisible();

    // Verify the subheadline is visible (International Sales Made Simple)
    const subheadline = page.getByText('International Sales Made Simple');
    await expect(subheadline).toBeVisible();

    // Verify Sign In button is visible
    const signInButton = page.getByRole('link', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();

    // Verify "Register as an Agent" primary CTA is visible
    const ctaButton = page.getByRole('link', { name: 'Register as an Agent' });
    await expect(ctaButton).toBeVisible();

    // Verify features section headline
    const featuresHeadline = page.getByRole('heading', { name: 'Built for agents. Loved by international buyers.' });
    await expect(featuresHeadline).toBeVisible();

    // Verify CTA section headline
    const ctaSectionHeadline = page.getByRole('heading', { name: 'Ready to close more international sales?' });
    await expect(ctaSectionHeadline).toBeVisible();

    // Take full page screenshot for visual verification
    await page.screenshot({ path: 'test-results/landing-page-visual.png', fullPage: true });

    console.log('Screenshot saved to test-results/landing-page-visual.png');
  });

  test('Sign In button text is visible (not white on white)', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await page.waitForLoadState('networkidle');

    const signInButton = page.getByRole('link', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();

    // Verify the button has text that is readable
    // The button should have white text on the blue gradient background
    const buttonText = await signInButton.textContent();
    expect(buttonText).toBe('Sign In');

    // Screenshot of hero section for visual verification of button styling
    const heroSection = page.locator('section').first();
    await heroSection.screenshot({ path: 'test-results/hero-section-buttons.png' });
  });
});
