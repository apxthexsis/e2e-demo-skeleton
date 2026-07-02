import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { test as projectTest } from './create-project.page';

// Chained fixture: extends the project fixture so every task spec starts
// with a freshly created project without repeating setup code.
export const test = projectTest;

export class ManageTasksPage extends BasePage {
  async openProject(projectName: string): Promise<void> {
    await this.navigateTo('/');
    await this.waitForDashboard();
    await this.page
      .locator(this.locators.Dashboard.projectCardByName(projectName))
      .click();
    await expect(
      this.page.locator(this.locators.Project.projectTitle)
    ).toHaveText(projectName);
  }

  async addTask(title: string): Promise<void> {
    await this.page.locator(this.locators.Project.taskTitleInput).fill(title);
    await this.page.locator(this.locators.Project.taskSubmitButton).click();
    await expect(
      this.page.locator(this.locators.Project.taskItemByTitle(title))
    ).toBeVisible();
  }

  async completeTask(title: string): Promise<void> {
    await this.page
      .locator(this.locators.Project.taskCheckboxByTitle(title))
      .check();
    await expect(
      this.page.locator(this.locators.Project.taskItemByTitle(title))
    ).toHaveClass(/done/);
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
