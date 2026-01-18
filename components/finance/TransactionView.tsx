'use client';

import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Account {
  id: string;
  name: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  account_id: string;
  description: string | null;
  date: string;
}

interface TransactionViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  loading: boolean;
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TransactionView({
  transactions,
  accounts,
  categories,
  loading,
  onAdd,
  onDelete,
}: TransactionViewProps) {
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category_id: '',
    account_id: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || 'Unknown';
  const getCategoryIcon = (id: string) =>
    categories.find((c) => c.id === id)?.icon || '💰';
  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || 'Unknown';

  const handleSubmit = async () => {
    if (!form.amount || !form.category_id || !form.account_id) return;

    await onAdd({
      type: form.type,
      amount: parseFloat(form.amount),
      category_id: form.category_id,
      account_id: form.account_id,
      description: form.description || null,
      date: form.date,
    });

    setForm({
      type: 'expense',
      amount: '',
      category_id: '',
      account_id: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const activeAccounts = accounts.filter((a) => a.is_active);
  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 text-gray-900">Tambah Transaksi</h3>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setForm({ ...form, type: 'income', category_id: '' })}
            className={`py-2 rounded-lg font-medium transition-colors ${
              form.type === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}
            className={`py-2 rounded-lg font-medium transition-colors ${
              form.type === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pengeluaran
          </button>
        </div>

        <select
          value={form.account_id}
          onChange={(e) => setForm({ ...form, account_id: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Pilih Akun</option>
          {activeAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Pilih Kategori</option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Jumlah (Rp)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Deskripsi (opsional)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !form.amount || !form.category_id || !form.account_id}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {loading ? 'Menyimpan...' : 'Tambah Transaksi'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Belum ada transaksi</p>
          </div>
        ) : (
          transactions.map((trans) => (
            <div key={trans.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex gap-3">
                {trans.type === 'income' ? (
                  <TrendingUp className="text-green-600 flex-shrink-0 mt-1" size={20} />
                ) : (
                  <TrendingDown className="text-red-600 flex-shrink-0 mt-1" size={20} />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {getCategoryIcon(trans.category_id)}{' '}
                      {getCategoryName(trans.category_id)}
                    </h4>
                    <button
                      onClick={() => onDelete(trans.id)}
                      className="flex-shrink-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p
                    className={`text-lg font-bold ${
                      trans.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trans.type === 'income' ? '+' : '-'} Rp{' '}
                    {Number(trans.amount).toLocaleString('id-ID')}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {getAccountName(trans.account_id)} •{' '}
                    {format(new Date(trans.date), 'dd MMM yyyy')}
                  </p>

                  {trans.description && (
                    <p className="text-sm text-gray-600 mt-1">{trans.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}