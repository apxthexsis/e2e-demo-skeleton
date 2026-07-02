import { test, LoginPage } from '../pages/login.page';

test(
  'Login - user can sign in with email and OTP',
  { tag: ['@sanity', '@ci', '@auth'] },
  async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.performLogin();
  }
);

test(
  'Login - invalid OTP is rejected',
  { tag: ['@ci', '@auth'] },
  async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.setup();
    await loginPage.requestCode('invalid-otp@demo.test');
    await page.fill('[data-testid="otp-input"]', 'WRONG1');
    await page.click('[data-testid="verify-code-button"]');
    await page
      .locator('[data-testid="error-banner"]')
      .waitFor({ state: 'visible' });
  }
);
