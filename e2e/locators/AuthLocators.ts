export const AuthLocators = {
  authContainer: '[data-testid="auth-container"]',
  emailInput: '[data-testid="email-input"]',
  requestCodeButton: '[data-testid="request-code-button"]',
  otpContainer: '[data-testid="otp-container"]',
  otpInput: '[data-testid="otp-input"]',
  verifyCodeButton: '[data-testid="verify-code-button"]',
  errorBanner: '[data-testid="error-banner"]',
  userEmail: '[data-testid="user-email"]',
  logoutButton: '[data-testid="logout-button"]'
} as const;
