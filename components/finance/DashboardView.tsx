'use client';

import { useMemo } from 'react';
import { Wallet, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface Account {
  id: string;
  name: string;
  type: string;
  initial_balance: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  account_id: string;
  category_id: string;
  date: string;
}

interface Recurring {
  id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  frequency: string;
  next_run: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface DashboardViewProps {
  accounts: Account[];
  transactions: Transaction[];
  recurring: Recurring[];
  categories: Category[];
}

export default function DashboardView({
  accounts,
  transactions,
  recurring,
  categories,
}: DashboardViewProps) {
  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || 'Unknown';
  const getCategoryIcon = (id: string) =>
    categories.find((c) => c.id === id)?.icon || '💰';

  const accountsWithBalance = useMemo(() => {
    return accounts
      .filter((a) => a.is_active)
      .map((acc) => {
        const balance = transactions
          .filter((t) => t.account_id === acc.id)
          .reduce((bal, t) => {
            return t.type === 'income'
              ? bal + Number(t.amount)
              : bal - Number(t.amount);
          }, Number(acc.initial_balance));

        return { ...acc, balance };
      });
  }, [accounts, transactions]);

  const activeRecurring = useMemo(
    () => recurring.filter((r) => r.is_active).slice(0, 5),
    [recurring]
  );

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  );

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthlyTrans = transactions.filter((t) => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });

    const income = monthlyTrans
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = monthlyTrans
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expense, net: income - expense };
  }, [transactions]);

  const totalBalance = accountsWithBalance.reduce(
    (sum, acc) => sum + acc.balance,
    0
  );

  const accountTypeLabels: Record<string, string> = {
    cash: 'Tunai',
    bank: 'Bank',
    ewallet: 'E-Wallet',
    credit: 'Kredit',
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
          <p className="text-xs opacity-90 mb-1">Total Saldo</p>
          <p className="text-xl font-bold">Rp {totalBalance.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <p className="text-xs opacity-90 mb-1">Pemasukan Bulan Ini</p>
          <p className="text-xl font-bold">
            Rp {monthlyStats.income.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4">
          <p className="text-xs opacity-90 mb-1">Pengeluaran Bulan Ini</p>
          <p className="text-xl font-bold">
            Rp {monthlyStats.expense.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Accounts */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
          <Wallet size={18} />
          Akun Aktif
        </h3>
        {accountsWithBalance.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Belum ada akun. Tambahkan di tab Akun.
          </p>
        ) : (
          <div className="space-y-2">
            {accountsWithBalance.map((acc) => (
              <div
                key={acc.id}
                className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900">{acc.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {accountTypeLabels[acc.type]}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  Rp {acc.balance.toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 text-gray-900">Transaksi Terbaru</h3>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada transaksi.</p>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((trans) => (
              <div
                key={trans.id}
                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  {trans.type === 'income' ? (
                    <TrendingUp className="text-green-600" size={16} />
                  ) : (
                    <TrendingDown className="text-red-600" size={16} />
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {getCategoryIcon(trans.category_id)}{' '}
                      {getCategoryName(trans.category_id)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(trans.date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-semibold ${
                    trans.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trans.type === 'income' ? '+' : '-'} Rp{' '}
                  {Number(trans.amount).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Recurring */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
          <RefreshCw size={18} />
          Transaksi Berulang Aktif
        </h3>
        {activeRecurring.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada transaksi berulang.</p>
        ) : (
          <div className="space-y-2">
            {activeRecurring.map((rec) => (
              <div
                key={rec.id}
                className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {getCategoryIcon(rec.category_id)}{' '}
                    {getCategoryName(rec.category_id)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {rec.frequency} • Next: {format(new Date(rec.next_run), 'dd MMM')}
                  </p>
                </div>
                <p
                  className={`font-semibold ${
                    rec.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {rec.type === 'income' ? '+' : '-'} Rp{' '}
                  {Number(rec.amount).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}