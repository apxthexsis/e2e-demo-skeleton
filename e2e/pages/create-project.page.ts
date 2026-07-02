import { expect, test as base, type Page } from '@playwright/test';
import { BasePage } from './base-page';
import { TestDataFactory } from '../utils/test-data-factory';

type ProjectData = { name: string; description: string };

type ProjectFixture = {
  projectData: ProjectData;
  projectName: string;
};

export const test = base.extend<ProjectFixture>({
  projectData: async ({}, use) => {
    await use(TestDataFactory.createProjectData());
  },
  projectName: async ({ page, projectData }, use) => {
    await createProject(page, projectData);
    await use(projectData.name);
  }
});

export class CreateProjectPage extends BasePage {
  async openCreateModal(): Promise<void> {
    await this.navigateTo('/');
    await this.waitForDashboard();
    await this.page.locator(this.locators.Dashboard.newProjectButton).click();
    await expect(
      this.page.locator(this.locators.Dashboard.projectModal)
    ).toBeVisible();
  }

  async fillProjectForm(data: ProjectData): Promise<void> {
    await this.page
      .locator(this.locators.Dashboard.projectNameInput)
      .fill(data.name);
    await this.page
      .locator(this.locators.Dashboard.projectDescriptionInput)
      .fill(data.description);
  }

  async submitProjectForm(): Promise<void> {
    await this.page
      .locator(this.locators.Dashboard.projectSubmitButton)
      .click();
  }

  async verifyProjectVisible(name: string): Promise<void> {
    await expect(
      this.page.locator(this.locators.Dashboard.projectCardByName(name))
    ).toBeVisible();
  }

  async createProject(data: ProjectData): Promise<void> {
    await this.openCreateModal();
    await this.fillProjectForm(data);
    await this.submitProjectForm();
    await this.verifyProjectVisible(data.name);
  }
}

export async function createProject(
  page: Page,
  data?: ProjectData
): Promise<ProjectData> {
  const projectData = data ?? TestDataFactory.createProjectData();
  await new CreateProjectPage(page).createProject(projectData);
  return projectData;
}

export { expect } from '@playwright/test';
