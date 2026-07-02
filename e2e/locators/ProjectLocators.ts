export const ProjectLocators = {
  projectPage: '[data-testid="project-page"]',
  projectTitle: '[data-testid="project-title"]',
  backToProjects: '[data-testid="back-to-projects"]',
  taskList: '[data-testid="task-list"]',
  taskForm: '[data-testid="task-form"]',
  taskTitleInput: '[data-testid="task-title-input"]',
  taskSubmitButton: '[data-testid="task-submit-button"]',
  taskItemByTitle: (title: string) =>
    `[data-testid="task-item"][data-task-title="${title}"]`,
  taskCheckboxByTitle: (title: string) =>
    `[data-testid="task-item"][data-task-title="${title}"] [data-testid="task-checkbox"]`
} as const;
