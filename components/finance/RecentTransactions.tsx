import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category?: {
    name: string;
    icon: string;
  };
  account?: {
    name: string;
  };
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaksi Terbaru</h3>
      
      {transactions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Belum ada transaksi</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2 rounded-lg ${
                  transaction.type === 'income' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {transaction.type === 'income' ? (
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {transaction.category?.icon} {transaction.category?.name || 'Tanpa Kategori'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{transaction.account?.name || '-'}</span>
                    <span>•</span>
                    <span>{format(new Date(transaction.date), 'dd MMM yyyy', { locale: id })}</span>
                  </div>
                </div>
              </div>
              <p className={`font-semibold text-sm whitespace-nowrap ml-2 ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}