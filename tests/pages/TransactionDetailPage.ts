import { type Page, type Locator, expect } from '@playwright/test';

export class TransactionDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly participantsTab: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use class selector to distinguish from App Header H1
    this.heading = page.locator('h1.text-3xl');
    // Regex to match "Participants (N)"
    this.participantsTab = page.getByRole('tab', { name: /Participants/ });
  }

  async validateTitle(title: string) {
    await expect(this.heading).toHaveText(title);
  }

  async validateParticipantsCount(count: number) {
    await expect(this.participantsTab).toHaveText(`Participants (${count})`);
  }
}

