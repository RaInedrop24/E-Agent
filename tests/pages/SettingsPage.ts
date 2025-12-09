import { type Page, type Locator, expect } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly saveButton: Locator;
  readonly fullNameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText('User Settings', { exact: false });
    this.saveButton = page.getByRole('button', { name: 'Save profile' });
    this.fullNameInput = page.getByLabel('Full name');
  }

  async goto() {
    await this.page.goto('/settings');
  }
}

