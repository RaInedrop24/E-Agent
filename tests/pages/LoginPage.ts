import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  // Error message is dynamic, so we might not define a static locator for specific text, 
  // but we can define the container or a method to check it.
  readonly errorText: Locator;

  readonly card: Locator;

  constructor(page: Page) {
    this.page = page;
    this.card = page.locator('[data-slot="card"]');
    // CardTitle is a div, so we find it by text within the card
    this.heading = this.card.getByText('Login', { exact: true });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorText = page.locator('.text-red-600');
    // Scope register link to the card to avoid header/footer links
    this.registerLink = this.card.getByRole('link', { name: 'Register' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, pass: string) {
    await this.fillEmail(email);
    await this.fillPassword(pass);
    await this.submit();
  }

  async getErrorMessage() {
    return await this.errorText.textContent();
  }
}

