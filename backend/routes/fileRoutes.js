import express from 'express';
import multer from 'multer';
import {
  uploadFile,
  getFile,
  deleteFile
} from '../controllers/files.js';

import fileTypeFilter from '../middleware/fileFilter.js';

import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileTypeFilter
});


// Upload file
router.post('/upload',authenticate, upload.single('file'), uploadFile);

// Get file
router.get('/:fileName',authenticate, getFile);

// Delete file (optional)
router.delete('/:fileName',authenticate, deleteFile);

export default router;