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
    await loginPage.submitOtpCode('WRONG1');
    await loginPage.verifyErrorVisible();
  }
);
