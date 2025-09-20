

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './routes.js';
import authRoutes from './routes/auth.js';
import sequelize from './models/index.js';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Frontend URL
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type', 'X-Filename']
}));

// Parse JSON bodies
app.use(express.json());

// Create necessary directories if they don't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const templatesDir = path.join(uploadsDir, 'templates');
const documentsDir = path.join(process.cwd(), 'documents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
  console.log('Created templates directory');
}

if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
  console.log('Created documents directory');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Authentication routes
app.use('/api/auth', authRoutes);

// Protected API routes
app.use('/api', routes);

// Serve static files from frontend dist directory
const frontendDistPath = path.join(process.cwd(), '..', '..', 'frontend', 'dist');

console.log('Current working directory:', process.cwd());
console.log('Frontend dist path:', frontendDistPath);
console.log('Frontend dist exists:', fs.existsSync(frontendDistPath));

// Check if frontend dist directory exists
if (fs.existsSync(frontendDistPath)) {
  console.log('Serving static files from:', frontendDistPath);
  app.use(express.static(frontendDistPath));
  
  // Serve the React app for the root route and common SPA routes
  const spaRoutes = ['/', '/login', '/dashboard', '/templates', '/documents', '/generate-document', '/upload-template'];
  
  spaRoutes.forEach(route => {
    app.get(route, (req: Request, res: Response) => {
      const indexPath = path.join(frontendDistPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend not built. Please run "npm run build" in the frontend directory.');
      }
    });
  });
} else {
  console.log('Frontend dist directory not found:', frontendDistPath);
  app.get('/', (req: Request, res: Response) => {
    res.status(404).send('Frontend not built. Please run "npm run build" in the frontend directory.');
  });
}

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Database connected and models synced.');
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();
