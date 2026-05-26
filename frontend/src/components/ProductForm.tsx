import { useState } from 'react';

interface ProductFormProps {
  onAdded: () => void;
}

export default function ProductForm({ onAdded }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    initial_price: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.url || !formData.name || !formData.initial_price) {
      setError('All fields required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.url,
          name: formData.name,
          initial_price: parseFloat(formData.initial_price),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add product');
      }

      setFormData({ url: '', name: '', initial_price: '' });
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border mb-6">
      <h3 className="text-lg font-bold mb-4">Add New Product</h3>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <div className="grid grid-cols-3 gap-4">
        <input
          type="url"
          placeholder="Product URL"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="px-3 py-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Product Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="px-3 py-2 border rounded"
          required
        />
        <input
          type="number"
          placeholder="Initial Price"
          value={formData.initial_price}
          onChange={(e) => setFormData({ ...formData, initial_price: e.target.value })}
          className="px-3 py-2 border rounded"
          step="0.01"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Product'}
      </button>
    </form>
  );
}