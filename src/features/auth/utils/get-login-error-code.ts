import { LOGIN_ERROR_CODES, type LoginErrorCode } from "../constants/login-errors";

const LOGIN_ERROR_SET = new Set<string>(LOGIN_ERROR_CODES);

export function getLoginErrorCodeFromSearch(search: string): LoginErrorCode | null {
  const value = new URLSearchParams(search).get("error");
  if (!value || !LOGIN_ERROR_SET.has(value)) {
    return null;
  }

  return value as LoginErrorCode;
}
