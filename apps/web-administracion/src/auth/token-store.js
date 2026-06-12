const tokenState = {
  accessToken: null,
  refreshToken: null,
};

export function setTokens({ accessToken, refreshToken }) {
  tokenState.accessToken = accessToken ?? null;
  tokenState.refreshToken = refreshToken ?? tokenState.refreshToken;
}

export function clearTokens() {
  tokenState.accessToken = null;
  tokenState.refreshToken = null;
}

export function getAccessToken() {
  return tokenState.accessToken;
}

export function getRefreshToken() {
  return tokenState.refreshToken;
}
