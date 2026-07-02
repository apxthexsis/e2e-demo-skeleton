import { expect, test as base, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { fetchOtpCode } from '../utils/otp';
import { TestDataFactory } from '../utils/test-data-factory';

// Auth specs must start unauthenticated, so this fixture chain drops the
// storage state that the setup project saved for everyone else.
export const test = base.extend({
  storageState: async ({}, use) => {
    await use(undefined);
  }
});

export class LoginPage extends BasePage {
  async setup(): Promise<void> {
    await this.navigateTo('/');
    await expect(
      this.page.locator(this.locators.Auth.authContainer)
    ).toBeVisible();
  }

  async requestCode(email: string): Promise<void> {
    await this.page.locator(this.locators.Auth.emailInput).fill(email);
    await this.page.locator(this.locators.Auth.requestCodeButton).click();
    // The OTP step replaces the email step asynchronously — assert the
    // transition finished before the flow reads the code.
    await expect(
      this.page.locator(this.locators.Auth.otpContainer)
    ).toBeVisible();
  }

  async submitOtpCode(code: string): Promise<void> {
    await this.page.locator(this.locators.Auth.otpInput).fill(code);
    await this.page.locator(this.locators.Auth.verifyCodeButton).click();
  }

  async submitOtp(email: string): Promise<void> {
    await this.submitOtpCode(await fetchOtpCode(this.page, email));
  }

  async verifyLoggedIn(email: string): Promise<void> {
    await this.waitForDashboard();
    await expect(this.page.locator(this.locators.Auth.userEmail)).toHaveText(
      email
    );
  }

  async verifyErrorVisible(): Promise<void> {
    await expect(
      this.page.locator(this.locators.Auth.errorBanner)
    ).toBeVisible();
  }

  async performLogin(
    email = TestDataFactory.createUserEmail()
  ): Promise<string> {
    await this.setup();
    await this.requestCode(email);
    await this.submitOtp(email);
    await this.verifyLoggedIn(email);
    return email;
  }

  async logout(): Promise<void> {
    await this.page.locator(this.locators.Auth.logoutButton).click();
    await expect(
      this.page.locator(this.locators.Auth.authContainer)
    ).toBeVisible();
  }
}

export async function performLogin(
  page: Page,
  email?: string
): Promise<string> {
  return new LoginPage(page).performLogin(email);
}

export { expect } from '@playwright/test';
