export const LOGIN_ERROR_CODES = [
  "oauth-exchange-failed",
  "session-user-missing",
  "not-approved",
] as const;

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];

export const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  "oauth-exchange-failed": "Sign-in could not be completed. Please try again.",
  "session-user-missing": "Your account details were not returned by Google. Please retry.",
  "not-approved": "Your account is not approved yet. Please contact the administrator.",
};
