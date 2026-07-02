import type { Page } from '@playwright/test';
import { Locators } from '../locators';
import { CommonUtils, WAIT_TIMEOUTS } from '../utils/common';

export abstract class BasePage {
  protected readonly utils: CommonUtils;
  protected readonly locators = Locators;

  constructor(protected readonly page: Page) {
    this.utils = new CommonUtils(page);
  }

  async navigateTo(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitForDashboard(): Promise<void> {
    await this.page
      .locator(this.locators.Dashboard.dashboard)
      .waitFor({ state: 'visible', timeout: WAIT_TIMEOUTS.medium });
  }
}
