import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.SERVER_PORT || '3001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || '"SJP Platform" <noreply@sjp.dev>',
  },

  crossref: {
    depositUrl: process.env.CROSSREF_DEPOSIT_URL || '',
    username: process.env.CROSSREF_USERNAME || '',
    password: process.env.CROSSREF_PASSWORD || '',
  },

  scholar: {
    apiUrl: process.env.SCHOLAR_API_URL || '',
    apiKey: process.env.SCHOLAR_API_KEY || '',
  },

  journal: {
    maxFileSizeKb: 10240,
    allowedExtensions: ['pdf', 'doc', 'docx'],
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    referenceFormat: 'SJP-%02d-%05d',
    statuses: ['submitted', 'under_review', 'approved', 'rejected', 'published'] as const,
    reviewableStatuses: ['submitted', 'under_review'] as const,
    journalCacheTtl: 300,
  },

  uploads: {
    dir: path.resolve(__dirname, '../../uploads/manuscripts'),
  },
} as const;
