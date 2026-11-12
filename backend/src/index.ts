import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { simulatedDelay } from './middleware/delay';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Simulated latency (300ms) for realistic UX as per spec
app.use(simulatedDelay(300));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'demand-planner-backend', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Demand Planner Backend running on http://localhost:${PORT}`);
});

