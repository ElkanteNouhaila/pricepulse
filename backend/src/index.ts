import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import productRoutes from './routes/products';
import { startPriceSimulation } from './jobs/priceSimulation';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/products', productRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// ── Error-handling middleware (must be last) ─────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

// ── Bootstrap ────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`Backend running on port ${PORT}`);

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id            SERIAL PRIMARY KEY,
        url           VARCHAR(2048) NOT NULL UNIQUE,
        name          VARCHAR(255)  NOT NULL,
        initial_price DECIMAL(10, 2) NOT NULL,
        current_price DECIMAL(10, 2) NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS price_history (
        id          SERIAL PRIMARY KEY,
        product_id  INT REFERENCES products(id) ON DELETE CASCADE,
        price       DECIMAL(10, 2) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_price_history_product_id
        ON price_history(product_id);
    `);
    console.log('Database initialised');
  } catch (err) {
    console.error('Database initialisation failed:', err);
    process.exit(1);
  }

  startPriceSimulation();
});

export default app;