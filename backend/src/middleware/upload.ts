import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('pdf')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          error: 'File too large',
          message: 'File size must be less than 10MB' 
        });
      }
      return res.status(400).json({ 
        error: 'Upload error',
        message: err.message 
      });
    }
    
    if (err) {
      return res.status(400).json({ 
        error: 'Invalid file',
        message: err.message 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file provided',
        message: 'Please upload a PDF file' 
      });
    }
    
    next();
  });
};