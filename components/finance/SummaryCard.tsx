import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'balance' | 'income' | 'expense';
}

export default function SummaryCard({ title, amount, type }: SummaryCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getIcon = () => {
    switch (type) {
      case 'balance':
        return <Wallet className="w-6 h-6" />;
      case 'income':
        return <TrendingUp className="w-6 h-6" />;
      case 'expense':
        return <TrendingDown className="w-6 h-6" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'balance':
        return 'from-blue-600 to-blue-700';
      case 'income':
        return 'from-green-600 to-green-700';
      case 'expense':
        return 'from-red-600 to-red-700';
    }
  };

  return (
    <div className={`bg-gradient-to-br ${getColor()} rounded-xl p-6 text-white`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-white/20 p-2 rounded-lg">
          {getIcon()}
        </div>
        <span className="text-sm font-medium opacity-90">{title}</span>
      </div>
      <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
    </div>
  );
}