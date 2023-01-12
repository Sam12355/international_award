/**
 * Mock for storage.service — avoids real fs operations during tests.
 */
const fn = () => jest.fn() as jest.Mock<any, any>;

const multerMiddleware = (_req: any, _res: any, next: () => void) => {
  _req.file = {
    filename: 'test-upload.pdf',
    originalname: 'manuscript.pdf',
    size: 2048,
    mimetype: 'application/pdf',
  };
  next();
};

export const uploadManuscript = {
  single: () => multerMiddleware,
};

export const deleteFile = fn();

export const resolveFilePath = fn().mockImplementation((p: string) => `/uploads/${p}`);
