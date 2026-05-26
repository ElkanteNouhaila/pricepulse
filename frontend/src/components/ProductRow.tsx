interface Product {
    id: number;
    name: string;
    initial_price: number;
    current_price: number;
  }
  
  interface ProductRowProps {
    product: Product;
    isSelected: boolean;
    onSelect: () => void;
    onDeleted: () => void;
  }
  
  export default function ProductRow({
    product,
    isSelected,
    onSelect,
    onDeleted,
  }: ProductRowProps) {
    const change = product.current_price - product.initial_price;
    const changePercent = (change / product.initial_price) * 100;
    const isIncrease = change > 0;
  
    const handleDelete = async () => {
      if (!confirm('Delete this product?')) return;
  
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/products/${product.id}`,
          { method: 'DELETE' }
        );
        if (response.ok) {
          onDeleted();
        }
      } catch {
        alert('Failed to delete product');
      }
    };
  
    return (
      <tr
        onClick={onSelect}
        className={`border-b cursor-pointer hover:bg-gray-50 ${
          isSelected ? 'bg-blue-50' : ''
        }`}
      >
        <td className="px-4 py-3 font-medium">{product.name}</td>
        <td className="px-4 py-3 text-right">${product.initial_price.toFixed(2)}</td>
        <td className="px-4 py-3 text-right font-semibold">
          ${product.current_price.toFixed(2)}
        </td>
        <td className={`px-4 py-3 text-center font-bold ${
          isIncrease ? 'text-red-600' : 'text-green-600'
        }`}>
          {isIncrease ? '📈' : '📉'} {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
        </td>
        <td className="px-4 py-3 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Delete
          </button>
        </td>
      </tr>
    );
  }