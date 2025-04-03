import { storeFile, getFileStream, deleteFile as deleteStoredFile } from '../services/storage.js';
import { createMessage } from '../models/Message.js';
import path from 'path';

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = await storeFile(req.file.buffer, req.file.originalname);
    const fileUrl = `/api/files/${fileName}`;

    // If uploaded as part of a chat
    if (req.body.roomId || req.body.private_chat_id) {
      const messageData = {
        sender_id: req.user.id,
        content: fileUrl,
        type: req.file.mimetype.split('/')[0] // 'image', 'video', etc.
      };

      if (req.body.roomId) {
        messageData.room_id = req.body.roomId;
      } else {
        messageData.private_chat_id = req.body.private_chat_id;
      }

      const message = await createMessage(messageData);
      return res.json({ message, fileUrl });
    }

    res.json({ fileUrl });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
};

export const getFile = async (req, res) => {
  try {
    const fileStream = await getFileStream(req.params.fileName);
    if (!fileStream) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate content type based on file extension
    const ext = path.extname(req.params.fileName).toLowerCase();
    const contentType = getContentType(ext);
    if (contentType) {
      res.set('Content-Type', contentType);
    }

    fileStream.pipe(res);
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ error: 'File retrieval failed' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    await deleteStoredFile(req.params.fileName);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
};

function getContentType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg'
  };
  return types[ext] || 'application/octet-stream';
}