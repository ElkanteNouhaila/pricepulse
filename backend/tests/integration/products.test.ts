jest.mock('../../src/index', () => ({
  pool: {
    query: jest.fn(),
  },
}));

import express from 'express';
import request from 'supertest';
import { pool } from '../../src/index';
import productRoutes from '../../src/routes/products';

const mockQuery = pool.query as jest.Mock;

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/products', productRoutes);

// ── Fixtures ──────────────────────────────────────────────────────────────────
const VALID_PRODUCT = {
  url: 'https://amazon.com/dp/TESTPRODUCT',
  name: 'Test Product',
  initial_price: 99.99,
};

const DB_PRODUCT_ROW = {
  id: 1,
  url: VALID_PRODUCT.url,
  name: VALID_PRODUCT.name,
  initial_price: '99.99',
  current_price: '99.99',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET /products ─────────────────────────────────────────────────────────────
describe('GET /products', () => {
  it('returns an empty list when no products exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/products');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns a list of products', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [DB_PRODUCT_ROW] });

    const res = await request(app).get('/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test Product');
  });

  it('returns 500 when the database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app).get('/products');

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('DB_ERROR');
  });
});

// ── POST /products ────────────────────────────────────────────────────────────
describe('POST /products', () => {
  it('creates a product and returns 201 with the new product', async () => {
    // First call: INSERT product — second call: INSERT price_history
    mockQuery
      .mockResolvedValueOnce({ rows: [DB_PRODUCT_ROW] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/products').send(VALID_PRODUCT);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Product');
    expect(res.body.id).toBe(1);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid URL with 400', async () => {
    const res = await request(app)
      .post('/products')
      .send({ ...VALID_PRODUCT, url: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_URL');
    // Validation happens before DB — no query should be made
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejects a negative price with 400', async () => {
    const res = await request(app)
      .post('/products')
      .send({ ...VALID_PRODUCT, initial_price: -5 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PRICE');
  });

  it('rejects a zero price with 400', async () => {
    const res = await request(app)
      .post('/products')
      .send({ ...VALID_PRODUCT, initial_price: 0 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PRICE');
  });

  it('rejects a missing name with 400', async () => {
    const res = await request(app)
      .post('/products')
      .send({ url: VALID_PRODUCT.url, initial_price: 99.99 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_NAME');
  });

  it('returns 400 with DUPLICATE_URL when the URL is already tracked', async () => {
    const duplicateError: any = new Error('duplicate key');
    duplicateError.code = '23505';
    mockQuery.mockRejectedValueOnce(duplicateError);

    const res = await request(app).post('/products').send(VALID_PRODUCT);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DUPLICATE_URL');
  });

  it('returns 500 when the database fails unexpectedly', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app).post('/products').send(VALID_PRODUCT);

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('DB_ERROR');
  });
});

// ── DELETE /products/:id ──────────────────────────────────────────────────────
describe('DELETE /products/:id', () => {
  it('deletes an existing product and returns success', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app).delete('/products/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when the product does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0 });

    const res = await request(app).delete('/products/999');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 500 when the database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app).delete('/products/1');

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('DB_ERROR');
  });
});

// ── GET /products/:id/history ─────────────────────────────────────────────────
describe('GET /products/:id/history', () => {
  it('returns price history for a product', async () => {
    const historyRows = [
      { price: '99.99', recorded_at: new Date().toISOString() },
      { price: '95.00', recorded_at: new Date().toISOString() },
    ];
    mockQuery.mockResolvedValueOnce({ rows: historyRows });

    const res = await request(app).get('/products/1/history');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].price).toBe('99.99');
  });

  it('returns 404 when there is no history', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/products/999/history');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('returns 500 when the database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app).get('/products/1/history');

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('DB_ERROR');
  });
});