import type { Page } from '@playwright/test';

/**
 * Reads the pending OTP from the app's test-only endpoint. The interface is
 * the interesting part: in real suites the implementation behind it polls a
 * Gmail inbox over IMAP, reads Redis, or queries a mail-catcher — the tests
 * never change, only this function does.
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
