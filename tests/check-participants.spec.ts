import { test, expect } from '@playwright/test';

test('Check participants tab shows emails', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:3001/login');
  
  // Login as admin
  await page.fill('input[type="email"]', 'martin@rainedrop.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard');
  
  // Navigate to transactions list
  await page.goto('http://localhost:3001/transactions');
  await page.waitForLoadState('networkidle');
  
  // Click on the first transaction's "View Details" button
  const viewDetailsButtons = page.locator('text=View Details').or(page.locator('text=Visualizza Dettagli'));
  await viewDetailsButtons.first().click();
  
  // Wait for transaction detail page to load
  await page.waitForURL('**/transaction/**');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of current view
  await page.screenshot({ path: 'test-screenshots/transaction-page-before-participants.png', fullPage: true });
  
  // Click on Participants tab
  const participantsTab = page.locator('[role="tab"]').filter({ hasText: /Participants|Partecipanti/ });
  await participantsTab.click();
  
  // Wait a moment for tab content to load
  await page.waitForTimeout(1000);
  
  // Take screenshot of participants tab
  await page.screenshot({ path: 'test-screenshots/participants-tab.png', fullPage: true });
  
  // Check for the error message
  const errorMessage = await page.locator('text="Please apply SQL migration to see emails"').count();
  
  if (errorMessage > 0) {
    console.log('❌ ERROR: Found "Please apply SQL migration to see emails" message');
    
    // Get the full HTML of the participants section
    const participantsContent = await page.locator('[role="tabpanel"]').filter({ has: page.locator('text=Participants, text=Partecipanti') }).innerHTML();
    console.log('Participants content:', participantsContent);
  } else {
    console.log('✅ No migration error message found');
    
    // Check if we have any participant emails displayed
    const participantsSection = await page.locator('[role="tabpanel"]').filter({ hasText: /Participants|Partecipanti/ }).first();
    const content = await participantsSection.textContent();
    console.log('Participants section content:', content);
  }
  
  // Log the console messages from the browser
  page.on('console', msg => {
    if (msg.text().includes('Participants')) {
      console.log('Browser console:', msg.text());
    }
  });
  
  // Check database query logs
  page.on('response', async response => {
    if (response.url().includes('supabase') && response.status() !== 200) {
      console.log('❌ Supabase error:', response.url(), response.status());
    }
  });
  
  // Expect no error message
  await expect(page.locator('text="Please apply SQL migration to see emails"')).toHaveCount(0);
});

