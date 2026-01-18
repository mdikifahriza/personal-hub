import { Wallet, Building2, Smartphone, CreditCard } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'credit';
  initial_balance: number;
}

interface AccountListProps {
  accounts: Account[];
}

export default function AccountList({ accounts }: AccountListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet className="w-5 h-5 text-yellow-600" />;
      case 'bank':
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5 text-green-600" />;
      case 'credit':
        return <CreditCard className="w-5 h-5 text-red-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAccountBg = (type: string) => {
    switch (type) {
      case 'cash':
        return 'bg-yellow-50';
      case 'bank':
        return 'bg-blue-50';
      case 'ewallet':
        return 'bg-green-50';
      case 'credit':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Akun</h3>
      
      {accounts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">Belum ada akun</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getAccountBg(account.type)}`}>
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{account.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{account.type}</p>
                </div>
              </div>
              <p className="font-semibold text-gray-900 text-sm">
                {formatCurrency(account.initial_balance)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}