import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ProductForm from './components/ProductForm';

interface Product {
  id: number;
  name: string;
  url: string;
  initial_price: number;
  current_price: number;
  created_at: string;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const fetchProducts = async () => {
    const scrollY = window.scrollY;
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch {
      setError('Failed to load products. Is the backend running?');
    } finally {
      setLoading(false);
      window.scrollTo(0, scrollY);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const handleProductAdded = () => {
    setShowForm(false);
    fetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">PricePulse</h1>
          <p className="text-gray-600">Smart Price Tracking Dashboard</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Tracked Products</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {showForm && <ProductForm onAdded={handleProductAdded} />}

        <Dashboard
          products={products}
          onRefresh={fetchProducts}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          loading={loading}
        />
      </main>
    </div>
  );
}
