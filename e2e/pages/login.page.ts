import { expect, test as base, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { fetchOtpCode, WAIT_TIMEOUTS } from '../utils/common';
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
    await this.page
      .locator(this.locators.Auth.authContainer)
      .waitFor({ state: 'visible', timeout: WAIT_TIMEOUTS.medium });
  }

  async requestCode(email: string): Promise<void> {
    await this.utils.waitAndFill(this.locators.Auth.emailInput, email);
    await this.utils.waitAndClick(this.locators.Auth.requestCodeButton);
    await this.page
      .locator(this.locators.Auth.otpContainer)
      .waitFor({ state: 'visible', timeout: WAIT_TIMEOUTS.medium });
  }

  async submitOtp(email: string): Promise<void> {
    const code = await fetchOtpCode(this.page, email);
    await this.utils.waitAndFill(this.locators.Auth.otpInput, code);
    await this.utils.waitAndClick(this.locators.Auth.verifyCodeButton);
  }

  async verifyLoggedIn(email: string): Promise<void> {
    await this.waitForDashboard();
    await expect(this.page.locator(this.locators.Auth.userEmail)).toHaveText(
      email
    );
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
    await this.utils.waitAndClick(this.locators.Auth.logoutButton);
    await this.page
      .locator(this.locators.Auth.authContainer)
      .waitFor({ state: 'visible', timeout: WAIT_TIMEOUTS.medium });
  }
}

export async function performLogin(
  page: Page,
  email?: string
): Promise<string> {
  return new LoginPage(page).performLogin(email);
}

export { expect } from '@playwright/test';
