const random = (length: number) =>
  Math.random()
    .toString(36)
    .slice(2, 2 + length);

export class TestDataFactory {
  static createUserEmail(): string {
    return `e2e-${Date.now()}-${random(4)}@demo.test`;
  }

  static createProjectData(): { name: string; description: string } {
    return {
      name: `Project ${random(6)}-${Date.now()}`.substring(0, 30),
      description: 'Created by the E2E showcase suite'
    };
  }

  static createTaskTitle(): string {
    return `Task ${random(8)}`;
  }
}
