import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import routes from './routes';
import { simulatedDelay } from './middleware/delay';

dotenv.config();

// ── Validate masterData.json at startup ────────────────────────────────────
const MASTER_DATA_PATH = path.resolve(__dirname, '../src/data/masterData.json');
// Also try the dist path (after build)
const MASTER_DATA_PATH_DIST = path.resolve(__dirname, 'data/masterData.json');
const masterDataPath = fs.existsSync(MASTER_DATA_PATH) ? MASTER_DATA_PATH : MASTER_DATA_PATH_DIST;

let masterDataStats = { brands: 0, products: 0, dataLoaded: false };
try {
  const raw = fs.readFileSync(masterDataPath, 'utf-8');
  const md = JSON.parse(raw);
  if (!md.items || !Array.isArray(md.items) || md.items.length === 0) {
    console.error('❌ FATAL: masterData.json has no items array. Check the file.');
    process.exit(1);
  }
  const brands = new Set(md.items.map((i: any) => i.brand));
  const products = new Set(md.items.map((i: any) => i.product));
  masterDataStats = { brands: brands.size, products: products.size, dataLoaded: true };
  console.log(`✅ masterData.json loaded: ${md.items.length} items, ${brands.size} brands, ${products.size} products`);
} catch (err: any) {
  console.error('❌ FATAL: Could not read/parse masterData.json:', err.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Simulated latency (300ms) for realistic UX as per spec
app.use(simulatedDelay(300));

// API routes
app.use('/api', routes);

// Health check at /health AND /api/health
const healthHandler = (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'demand-planner-backend',
    timestamp: new Date().toISOString(),
    dataLoaded: masterDataStats.dataLoaded,
    brands: masterDataStats.brands,
    products: masterDataStats.products,
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

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
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Frontend proxy: http://localhost:3000`);
});

