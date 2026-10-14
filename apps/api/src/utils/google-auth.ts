// ─────────────────────────────────────────────
// SENTINEL API — Google OAuth Utilities
// ─────────────────────────────────────────────

import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';

export const googleClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl
);

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

export async function verifyGoogleCredential(idToken: string): Promise<GoogleUserInfo> {
  // If running in development without live Google keys, support mock token for fast testing
  if (
    config.env === 'development' &&
    idToken.startsWith('mock_google_')
  ) {
    const mockEmail = idToken.replace('mock_google_', '');
    return {
      sub: `google_mock_${Date.now()}`,
      email: mockEmail,
      name: mockEmail.split('@')[0] || 'Google User',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      emailVerified: true,
    };
  }

  if (!config.google.clientId) {
    throw new Error('Google OAuth Client ID is not configured on the server.');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    throw new Error('Invalid Google ID token payload: missing email or subject ID.');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0] || 'Google User',
    picture: payload.picture,
    emailVerified: payload.email_verified ?? false,
  };
}

export async function getGoogleUserFromCode(code: string): Promise<GoogleUserInfo> {
  const { tokens } = await googleClient.getToken(code);
  if (!tokens.id_token) {
    throw new Error('Google did not return an ID token with the authorization code.');
  }
  return verifyGoogleCredential(tokens.id_token);
}
