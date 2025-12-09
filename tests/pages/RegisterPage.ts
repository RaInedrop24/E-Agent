import { type Page, type Locator, expect } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelectTrigger: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Create account' });
    this.fullNameInput = page.getByLabel('Full name');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    
    // Select is tricky with Shadcn/Radix. 
    // We target the trigger button inside the div that contains "Role" label
    this.roleSelectTrigger = page.locator('div.space-y-2', { hasText: 'Role' }).getByRole('combobox');
    
    this.submitButton = page.getByRole('button', { name: 'Create account' });
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(name: string, email: string, pass: string, role: 'Agent' | 'Buyer') {
    await this.fullNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    
    // Handle Select
    // If the current value is already correct, we might skip, but robust test selects explicitly.
    await this.roleSelectTrigger.click();
    await this.page.getByRole('option', { name: role }).click();
    
    await this.submitButton.click();
  }
}
