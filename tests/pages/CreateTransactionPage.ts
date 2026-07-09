import { type Page, type Locator } from '@playwright/test';

export class CreateTransactionPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly addressInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByLabel('Transaction Title');
    this.addressInput = page.getByLabel('Property Address');
    this.submitButton = page.getByRole('button', { name: 'Create Transaction' });
    this.errorAlert = page.locator('.bg-red-50'); // Based on className in component
  }

  async goto() {
    await this.page.goto('/transactions/create');
  }

  async createTransaction(title: string, address?: string) {
    await this.titleInput.fill(title);
    if (address) {
      await this.addressInput.fill(address);
    }
    await this.submitButton.click();
  }
}

