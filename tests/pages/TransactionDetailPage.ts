import { type Page, type Locator, expect } from '@playwright/test';

export class TransactionDetailPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly participantsTab: Locator;
  
  // Invite Buyer Modal
  readonly inviteButton: Locator;
  readonly inviteEmailInput: Locator;
  readonly sendInviteButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use class selector to distinguish from App Header H1
    this.heading = page.locator('h1.text-3xl');
    // Regex to match "Participants (N)"
    this.participantsTab = page.getByRole('tab', { name: /Participants/ });
    
    // Modal Selectors
    this.inviteButton = page.getByRole('button', { name: 'Invite Buyer' });
    this.inviteEmailInput = page.getByPlaceholder('buyer@example.com');
    this.sendInviteButton = page.getByRole('button', { name: 'Invite', exact: true });
    
    // Success toast/message (fuzzy match)
    this.successMessage = page.getByText('Buyer added successfully', { exact: false });
    // Error message container
    this.errorMessage = page.locator('.text-red-500.bg-red-50');
  }

  async validateTitle(title: string) {
    await expect(this.heading).toHaveText(title);
  }

  async validateParticipantsCount(count: number) {
    await expect(this.participantsTab).toHaveText(`Participants (${count})`);
  }

  async inviteBuyer(email: string) {
    await this.participantsTab.click();
    await this.inviteButton.click();
    await this.inviteEmailInput.fill(email);
    await this.sendInviteButton.click();
    
    // Check for success OR error
    try {
        await expect(this.successMessage).toBeVisible({ timeout: 5000 });
    } catch (e) {
        if (await this.errorMessage.isVisible()) {
            const error = await this.errorMessage.textContent();
            throw new Error(`Invite failed: ${error}`);
        }
        throw e;
    }
  }
  
  async validateBuyerPresent(email: string) {
    await expect(this.participantsTab).toBeVisible();
    await expect(this.page.getByText(email)).toBeVisible();
  }
}
