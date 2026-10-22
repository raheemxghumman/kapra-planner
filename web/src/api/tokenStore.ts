const REFRESH_TOKEN_KEY = 'kapra.refreshToken';

/**
 * Where the tokens live:
 * - access token: only in memory (this variable), so it disappears when the tab closes and
 *   is never written anywhere scripts could read it later;
 * - refresh token: in localStorage, so the session survives a page reload. The API and the
 *   website are on different domains, which rules out cookies (they would be third-party).
 */
let accessToken: string | null = null;

/** localStorage can throw (private mode, blocked storage), so every access is guarded. */
function readStorage(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value: string | null): void {
  try {
    if (value) localStorage.setItem(REFRESH_TOKEN_KEY, value);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Storage unavailable: the session simply will not survive a reload.
  }
}

export const tokenStore = {
  getAccessToken: () => accessToken,
  getRefreshToken: readStorage,
  save(tokens: { accessToken: string; refreshToken: string }): void {
    accessToken = tokens.accessToken;
    writeStorage(tokens.refreshToken);
  },
  clear(): void {
    accessToken = null;
    writeStorage(null);
  },
};
