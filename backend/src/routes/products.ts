import { Router, Request, Response } from 'express';
import { pool } from '../index';
import { validateUrl, validatePrice } from '../utils/validation';

const router = Router();

// ── GET /products ─────────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT id, name, url, initial_price, current_price, created_at
       FROM products
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products', code: 'DB_ERROR' });
  }
});

// ── POST /products ────────────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const { url, name, initial_price } = req.body;

  if (!validateUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL', code: 'INVALID_URL' });
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name required', code: 'INVALID_NAME' });
  }
  if (!validatePrice(initial_price)) {
    return res.status(400).json({ error: 'Invalid price', code: 'INVALID_PRICE' });
  }

  try {
    const price = parseFloat(initial_price);
    const result = await pool.query(
      `INSERT INTO products (url, name, initial_price, current_price)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [url, name.trim(), price, price]
    );

    await pool.query(
      'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
      [result.rows[0].id, price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'URL already tracked', code: 'DUPLICATE_URL' });
    }
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product', code: 'DB_ERROR' });
  }
});

// ── DELETE /products/:id ──────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product id', code: 'INVALID_ID' });
  }

  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product', code: 'DB_ERROR' });
  }
});

// ── GET /products/:id/history ─────────────────────────────────────────────────
router.get('/:id/history', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product id', code: 'INVALID_ID' });
  }

  try {
    const result = await pool.query(
      `SELECT price, recorded_at
       FROM price_history
       WHERE product_id = $1
       ORDER BY recorded_at ASC
       LIMIT 100`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No history found', code: 'NOT_FOUND' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history', code: 'DB_ERROR' });
  }
});

export default router;