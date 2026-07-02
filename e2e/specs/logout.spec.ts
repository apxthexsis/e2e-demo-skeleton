import { test, LoginPage } from '../pages/login.page';

test(
  'Logout - user returns to the login screen',
  { tag: ['@ci', '@auth'] },
  async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.performLogin();
    await loginPage.logout();
  }
);
