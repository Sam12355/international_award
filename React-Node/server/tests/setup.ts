/**
 * Global test setup — set env vars before anything imports config.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.SMTP_HOST = '';
process.env.CROSSREF_API_URL = '';
process.env.SCHOLAR_API_URL = '';
