import { doubleCsrf } from 'csrf-csrf';

// Configure CSRF protection
const csrfConfig = doubleCsrf({
  getSecret: () => process.env.SESSION_SECRET || 'default-csrf-secret',
  getSessionIdentifier: (req) => req.session?.id || '',
  cookieName: 'drjuro.csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false, // false for localhost development
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

export const generateToken = csrfConfig.generateCsrfToken;
export const doubleCsrfProtection = csrfConfig.doubleCsrfProtection;
