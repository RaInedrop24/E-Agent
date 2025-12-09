import { type Page, type Locator, expect } from '@playwright/test';

export class AuthCallbackPage {
  readonly page: Page;
  readonly welcomeText: Locator;
  readonly dashboardLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeText = page.getByText('Welcome to Estate Portal', { exact: false });
    this.dashboardLink = page.getByRole('link', { name: 'Go to dashboard' });
  }

  async goto() {
    await this.page.goto('/auth/callback');
  }
}

