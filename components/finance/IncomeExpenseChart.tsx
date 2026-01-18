import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ChartData {
  month: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data: ChartData[];
}

export default function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Pemasukan vs Pengeluaran</h3>
        <span className="text-sm text-gray-500 ml-auto">6 Bulan Terakhir</span>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value: number) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
              return value.toString();
            }}
          />
          <Tooltip 
            formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="income" 
            fill="#10b981" 
            name="Pemasukan" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="expense" 
            fill="#ef4444" 
            name="Pengeluaran" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}