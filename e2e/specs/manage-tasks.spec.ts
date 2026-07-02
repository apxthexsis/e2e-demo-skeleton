import { test, addAndCompleteTask } from '../pages/manage-tasks.page';
import { TestDataFactory } from '../utils/test-data-factory';

test(
  'Tasks - add a task to a project and complete it',
  { tag: ['@sanity', '@ci', '@tasks'] },
  async ({ page, projectName }) => {
    await addAndCompleteTask(
      page,
      projectName,
      TestDataFactory.createTaskTitle()
    );
  }
);
