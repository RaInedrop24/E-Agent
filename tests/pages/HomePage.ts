import { type Page, type Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'The Property Gateway' });
  }

  async goto() {
    await this.page.goto('/');
  }
}

