import { AuthLocators } from './AuthLocators';
import { DashboardLocators } from './DashboardLocators';
import { ProjectLocators } from './ProjectLocators';

export const Locators = {
  Auth: AuthLocators,
  Dashboard: DashboardLocators,
  Project: ProjectLocators
} as const;
