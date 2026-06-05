import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PricePoint {
  price: number;
  recorded_at: string;
}

interface PriceChartProps {
  productId: number;
}

export default function PriceChart({ productId }: PriceChartProps) {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/products/${productId}/history`
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setData(data);
        setError(null);
      } catch {
        setError('Failed to load price history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [productId]);

  if (loading) return <div className="text-gray-400 py-4">Loading chart...</div>;
  if (error) return <div className="text-red-600 py-4">{error}</div>;
  if (data.length === 0)
    return <div className="text-gray-400 py-4">No price history yet</div>;

  const chartData = data.map((point) => ({
    time: new Date(point.recorded_at).toLocaleDateString(),
    price: Number(point.price),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip
          formatter={(value: number) =>
            isNaN(value) ? value : `$${value.toFixed(2)}`
          }
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
