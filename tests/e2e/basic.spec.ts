import { test, expect } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Estate Portal' })).toBeVisible();
});

test('settings page renders', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText(/User Settings/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Save profile/i })).toBeVisible();
  // Fields should exist even when not authenticated (but actions may be no-op)
  await expect(page.getByLabel(/Full name/i)).toBeVisible();
});

test('auth confirmation splash renders', async ({ page }) => {
  await page.goto('/auth/callback');
  await expect(page.getByText(/Welcome to Estate Portal/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /Go to dashboard/i })).toBeVisible();
});

test('auth pages render', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Login' }).first()).toBeVisible();
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: /Create account/i }).or(page.getByRole('button', { name: /Create account/i }))).toBeVisible();
});

test('transactions list renders and links are present', async ({ page }) => {
  await page.goto('/transactions');
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^View$/ }).first()).toBeVisible();
});

test('transaction detail renders from mock data', async ({ page }) => {
  // Navigate via the list to avoid direct-route fragility
  await page.goto('/transactions');
  await Promise.all([
    page.waitForURL(/\/transaction\/.+/),
    page.getByRole('link', { name: /^View$/ }).first().click()
  ]);
  await expect(page.getByText(/Transaction Progress|of \d+ completed/)).toBeVisible();
});

