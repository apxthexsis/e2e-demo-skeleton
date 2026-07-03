import { expect, type Page } from '@playwright/test';
import { Locators } from '../locators';

export abstract class BasePage {
  protected readonly locators = Locators;

  constructor(protected readonly page: Page) {}

  async navigateTo(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitForDashboard(): Promise<void> {
    await expect(
      this.page.locator(this.locators.Dashboard.dashboard)
    ).toBeVisible();
  }
}
