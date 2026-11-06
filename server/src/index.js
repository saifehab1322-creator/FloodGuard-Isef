import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from './routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '200kb' }));
app.use('/api', routes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`FloodGuard API on http://localhost:${port}`));
