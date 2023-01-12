import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';

// Ensure upload directory exists
if (!fs.existsSync(config.uploads.dir)) {
  fs.mkdirSync(config.uploads.dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploads.dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (!(config.journal.allowedExtensions as readonly string[]).includes(ext)) {
    cb(ApiError.unsupportedMediaType(
      `Only ${config.journal.allowedExtensions.join(', ')} files are allowed`,
    ));
    return;
  }

  if (!(config.journal.allowedMimeTypes as readonly string[]).includes(file.mimetype)) {
    cb(ApiError.unsupportedMediaType('Invalid file type'));
    return;
  }

  cb(null, true);
};

export const uploadManuscript = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.journal.maxFileSizeKb * 1024,
  },
});

/**
 * Delete a file from disk. Silently ignores missing files.
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Silently ignore deletion errors — file may already be gone
  }
}

/**
 * Resolve absolute path for a stored manuscript.
 */
export function resolveFilePath(relativePath: string): string {
  return path.resolve(config.uploads.dir, relativePath);
}
