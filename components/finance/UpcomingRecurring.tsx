import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Repeat } from 'lucide-react';

interface Recurring {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  next_run: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: {
    name: string;
    icon: string;
  };
  account?: {
    name: string;
  };
}

interface UpcomingRecurringProps {
  recurring: Recurring[];
}

export default function UpcomingRecurring({ recurring }: UpcomingRecurringProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: 'Harian',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
      yearly: 'Tahunan',
    };
    return labels[frequency] || frequency;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Repeat className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Transaksi Berulang</h3>
      </div>
      
      {recurring.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Belum ada transaksi berulang</p>
      ) : (
        <div className="space-y-3">
          {recurring.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-lg ${
                  item.type === 'income' ? 'bg-green-50' : 'bg-orange-50'
                }`}>
                  <Calendar className={`w-4 h-4 ${
                    item.type === 'income' ? 'text-green-600' : 'text-orange-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {item.category?.icon} {item.category?.name || item.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{format(new Date(item.next_run), 'dd MMM yyyy', { locale: id })}</span>
                    <span>•</span>
                    <span>{getFrequencyLabel(item.frequency)}</span>
                  </div>
                </div>
              </div>
              <p className={`font-semibold text-sm whitespace-nowrap ml-2 ${
                item.type === 'income' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {formatCurrency(item.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}