import { test, createProject } from '../pages/create-project.page';

test(
  'Create project - project appears on the dashboard',
  { tag: ['@sanity', '@ci', '@projects'] },
  async ({ page }) => {
    await createProject(page);
  }
);
