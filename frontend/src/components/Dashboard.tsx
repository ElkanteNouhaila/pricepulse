import { useState } from 'react';
import ProductRow from './ProductRow';
import PriceChart from './PriceChart';

interface Product {
  id: number;
  name: string;
  url: string;
  initial_price: number;
  current_price: number;
  created_at: string;
}

interface DashboardProps {
  products: Product[];
  onRefresh: () => void;
}

export default function Dashboard({ products, onRefresh }: DashboardProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  return (
    <div>
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Product</th>
            <th className="px-4 py-2 text-right">Initial Price</th>
            <th className="px-4 py-2 text-right">Current Price</th>
            <th className="px-4 py-2 text-center">Change</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isSelected={selectedProductId === product.id}
              onSelect={() => setSelectedProductId(product.id)}
              onDeleted={onRefresh}
            />
          ))}
        </tbody>
      </table>

      {selectedProductId && (
        <div className="mt-8 p-4 bg-white border rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Price History</h3>
            <button
              onClick={() => setSelectedProductId(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <PriceChart productId={selectedProductId} />
        </div>
      )}
    </div>
  );
}