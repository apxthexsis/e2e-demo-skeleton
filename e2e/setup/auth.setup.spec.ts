import { test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import {
  SETUP_USER_EMAIL,
  STORAGE_STATE_PATH
} from '../constants/demo.constants';

// Runs once before the main project: signs in the shared user and saves the
// authenticated storage state so every other spec starts logged in.
test('setup: authenticate shared user', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.performLogin(SETUP_USER_EMAIL);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
