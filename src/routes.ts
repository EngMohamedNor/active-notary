import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import DocumentTemplate from './models/documentTemplate.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Multer setup for DOCX uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'templates'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// POST /api/templates/upload
router.post('/templates/upload', upload.single('template'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { originalname, filename, path: filePath } = req.file;
    const template = await DocumentTemplate.create({
      template_id: uuidv4(),
      template_name: originalname,
      template_path: filePath,
    });
    res.status(201).json({ message: 'Template uploaded', template });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload template', details: error });
  }
});

// GET /api/templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await DocumentTemplate.findAll();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates', details: error });
  }
});

// Example users route
router.get('/users', (req: Request, res: Response) => {
  res.json([{ id: 1, name: 'John Doe' }]);
});

export default router;
