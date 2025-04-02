import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

export const storeFile = async (buffer, originalName) => {
  await ensureUploadDir();
  
  const fileInfo = await fileTypeFromBuffer(buffer);
  const extension = fileInfo?.ext || path.extname(originalName).slice(1);
  const fileName = `${uuidv4()}${extension ? `.${extension}` : ''}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await fs.writeFile(filePath, buffer);
  return fileName;
};

export const getFileStream = async (fileName) => {
  const filePath = path.join(UPLOAD_DIR, fileName);
  try {
    await fs.access(filePath);
    return fs.createReadStream(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

export const deleteFile = async (fileName) => {
  const filePath = path.join(UPLOAD_DIR, fileName);
  await fs.unlink(filePath);
};