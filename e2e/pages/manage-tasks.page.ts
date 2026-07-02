import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { test as projectTest } from './create-project.page';
import { WAIT_TIMEOUTS } from '../utils/common';

// Chained fixture: extends the project fixture so every task spec starts
// with a freshly created project without repeating setup code.
export const test = projectTest;

export class ManageTasksPage extends BasePage {
  async openProject(projectName: string): Promise<void> {
    await this.navigateTo('/');
    await this.waitForDashboard();
    await this.utils.waitAndClick(
      this.locators.Dashboard.projectCardByName(projectName)
    );
    await expect(
      this.page.locator(this.locators.Project.projectTitle)
    ).toHaveText(projectName, {
      timeout: WAIT_TIMEOUTS.medium
    });
  }

  async addTask(title: string): Promise<void> {
    await this.utils.waitAndFill(this.locators.Project.taskTitleInput, title);
    await this.utils.waitAndClick(this.locators.Project.taskSubmitButton);
    await expect(
      this.page.locator(this.locators.Project.taskItemByTitle(title))
    ).toBeVisible({
      timeout: WAIT_TIMEOUTS.medium
    });
  }

  async completeTask(title: string): Promise<void> {
    await this.page
      .locator(this.locators.Project.taskCheckboxByTitle(title))
      .check();
    await expect(
      this.page.locator(this.locators.Project.taskItemByTitle(title))
    ).toHaveClass(/done/, { timeout: WAIT_TIMEOUTS.medium });
  }
}

export async function addAndCompleteTask(
  page: Page,
  projectName: string,
  taskTitle: string
): Promise<void> {
  const tasksPage = new ManageTasksPage(page);
  await tasksPage.openProject(projectName);
  await tasksPage.addTask(taskTitle);
  await tasksPage.completeTask(taskTitle);
}

export { expect } from '@playwright/test';
