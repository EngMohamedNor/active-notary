

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes.js';
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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
