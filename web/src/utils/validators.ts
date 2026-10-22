/**
 * Client-side checks that mirror the API's DTO rules, so users see problems instantly.
 * The API still validates everything; these are only for a better experience.
 */
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export const passwordProblem = (value: string): string | undefined => {
  if (value.length < 8) return 'Use at least 8 characters';
  if (value.length > 72) return 'Use at most 72 characters';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Include at least one letter and one number';
  return undefined;
};

/** Pakistani mobile number: 03001234567 or +923001234567. */
export const isPakistaniMobile = (value: string) => /^(\+92|0)3\d{9}$/.test(value.trim());
