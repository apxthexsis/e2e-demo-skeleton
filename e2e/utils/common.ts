import type { Page } from '@playwright/test';

export const WAIT_TIMEOUTS = {
  short: 5_000,
  medium: 15_000,
  long: 30_000
} as const;

export class CommonUtils {
  constructor(private readonly page: Page) {}

  async waitAndClick(
    selector: string,
    timeout = WAIT_TIMEOUTS.medium
  ): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click();
  }

  async waitAndFill(
    selector: string,
    value: string,
    timeout = WAIT_TIMEOUTS.medium
  ): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    await locator.fill(value);
  }
}

/**
 * Reads the pending OTP from the app's test-only endpoint — the same pattern
 * a real suite uses to read codes from Redis or a mail-catcher instead of a
 * live inbox.
 */
export async function fetchOtpCode(page: Page, email: string): Promise<string> {
  const response = await page.request.get(
    `/api/test/otp?email=${encodeURIComponent(email)}`
  );
  if (!response.ok()) {
    throw new Error(
      `No OTP available for ${email} (status ${response.status()})`
    );
  }
  const { code } = (await response.json()) as { code: string };
  return code;
}
