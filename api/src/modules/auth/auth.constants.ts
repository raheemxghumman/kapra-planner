/** Access tokens are short-lived, so a stolen one is useful for at most 15 minutes. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/** How long a user stays logged in without activity. */
export const REFRESH_TOKEN_TTL_DAYS = 7;

/** bcrypt cost factor: each +1 doubles the time needed to hash (and to brute-force). */
export const BCRYPT_ROUNDS = 12;

/** Lockout after this many wrong passwords in a row... */
export const MAX_FAILED_LOGINS = 5;

/** ...for this many minutes. */
export const LOCKOUT_MINUTES = 15;
