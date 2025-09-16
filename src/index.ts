import express, { Request, Response } from 'express';
import routes from './routes.js';
import sequelize from './models/index.js';

const app = express();
const port = process.env.PORT || 3000;

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
