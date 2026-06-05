import express from 'express';
import cors from 'cors';
import productRoutes from './routes/products';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/products', productRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;