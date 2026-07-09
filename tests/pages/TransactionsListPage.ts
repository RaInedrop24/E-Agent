import { type Page, type Locator } from '@playwright/test';

export class TransactionsListPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly firstViewLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Transactions' });
    this.firstViewLink = page.getByRole('link', { name: 'View' }).first();
  }

  async goto() {
    await this.page.goto('/transactions');
  }

  async clickFirstTransaction() {
    await this.firstViewLink.click();
  }
}

