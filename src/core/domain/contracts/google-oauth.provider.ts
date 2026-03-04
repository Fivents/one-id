export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface IGoogleOAuthProvider {
  getAuthorizationUrl(state: string): string;
  exchangeCodeForUserInfo(code: string): Promise<GoogleUserInfo>;
}
