export const DashboardLocators = {
  dashboard: '[data-testid="dashboard"]',
  emptyState: '[data-testid="projects-empty-state"]',
  newProjectButton: '[data-testid="new-project-button"]',
  projectModal: '[data-testid="project-modal"]',
  projectNameInput: '[data-testid="project-name-input"]',
  projectDescriptionInput: '[data-testid="project-description-input"]',
  projectSubmitButton: '[data-testid="project-submit-button"]',
  projectGrid: '[data-testid="project-grid"]',
  projectCardByName: (name: string) =>
    `[data-testid="project-card"][data-project-name="${name}"]`
} as const;
