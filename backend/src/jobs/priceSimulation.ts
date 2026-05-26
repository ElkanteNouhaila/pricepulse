import cron from 'node-cron';
import { pool } from '../index';

export async function simulatePriceUpdate(): Promise<void> {
  try {
    const products = await pool.query('SELECT id, current_price FROM products');

    for (const product of products.rows) {
      // Random change between -5% and +10%
      const changePercent = (Math.random() * 15) - 5;
      const newPrice = product.current_price * (1 + changePercent / 100);
      const roundedPrice = Math.round(newPrice * 100) / 100;

      // Update product
      await pool.query(
        'UPDATE products SET current_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [roundedPrice, product.id]
      );

      // Record in history
      await pool.query(
        'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
        [product.id, roundedPrice]
      );
    }

    console.log(`[${new Date().toISOString()}] Price simulation completed for ${products.rows.length} products`);
  } catch (err) {
    console.error('Price simulation error:', err);
    // Don't crash, just log and continue
  }
}

export function startPriceSimulation(): void {
  // Run every hour (adjust '0 * * * *' for testing: '*/5 * * * *' = every 5 min)
  cron.schedule('0 * * * *', simulatePriceUpdate);
  console.log('Price simulation scheduled (every hour)');

  // Optional: run once on startup
  simulatePriceUpdate();
}