

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
  origin: 'http://localhost:5173', // Frontend URL
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

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express + TypeScript!');
});

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
