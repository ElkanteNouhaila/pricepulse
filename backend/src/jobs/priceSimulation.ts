import cron from 'node-cron';
import { pool } from '../index';

export async function simulatePriceUpdate(): Promise<void> {
  try {
    const products = await pool.query('SELECT id, current_price FROM products');

    for (const product of products.rows) {
      // Random change between -5% and +10%
      const changePercent = Math.random() * 15 - 5;
      const newPrice = Number(product.current_price) * (1 + changePercent / 100);
      // Keep price above $0.01
      const roundedPrice = Math.max(0.01, Math.round(newPrice * 100) / 100);

      await pool.query(
        'UPDATE products SET current_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [roundedPrice, product.id]
      );

      await pool.query(
        'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
        [product.id, roundedPrice]
      );
    }

    console.log(
      `[${new Date().toISOString()}] Price simulation: updated ${products.rows.length} product(s)`
    );
  } catch (err) {
    // Log but never crash the server
    console.error('[priceSimulation] Error:', err);
  }
}

export function startPriceSimulation(): void {
  // Every 5 minutes — visible during a demo session.
  // Change to '0 * * * *' (every hour) for production.
  cron.schedule('*/5 * * * *', simulatePriceUpdate);
  console.log('Price simulation scheduled (every 5 minutes)');

  // Run once immediately so prices are live from the first request
  simulatePriceUpdate();
}