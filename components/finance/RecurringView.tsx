'use client';

import { useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
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

interface Recurring {
  id: string;
  account_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_run: string;
  description: string | null;
  is_active: boolean;
}

interface RecurringViewProps {
  recurring: Recurring[];
  accounts: Account[];
  categories: Category[];
  loading: boolean;
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function RecurringView({
  recurring,
  accounts,
  categories,
  loading,
  onAdd,
  onDelete,
}: RecurringViewProps) {
  const [form, setForm] = useState({
    account_id: '',
    category_id: '',
    type: 'expense' as 'income' | 'expense',
    amount: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    next_run: format(new Date(), 'yyyy-MM-dd'),
    description: '',
  });

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || 'Unknown';
  const getCategoryIcon = (id: string) =>
    categories.find((c) => c.id === id)?.icon || '💰';
  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || 'Unknown';

  const handleSubmit = async () => {
    if (!form.account_id || !form.category_id || !form.amount) return;

    await onAdd({
      account_id: form.account_id,
      category_id: form.category_id,
      type: form.type,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      next_run: form.next_run,
      description: form.description || null,
      is_active: true,
    });

    setForm({
      account_id: '',
      category_id: '',
      type: 'expense',
      amount: '',
      frequency: 'monthly',
      next_run: format(new Date(), 'yyyy-MM-dd'),
      description: '',
    });
  };

  const activeAccounts = accounts.filter((a) => a.is_active);
  const filteredCategories = categories.filter((c) => c.type === form.type);

  const frequencyLabels = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
          <RefreshCw size={18} />
          Transaksi Berulang
        </h3>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() =>
              setForm({ ...form, type: 'income', category_id: '' })
            }
            className={`py-2 rounded-lg font-medium transition-colors ${
              form.type === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() =>
              setForm({ ...form, type: 'expense', category_id: '' })
            }
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

        <select
          value={form.frequency}
          onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
          <option value="yearly">Tahunan</option>
        </select>

        <input
          type="date"
          value={form.next_run}
          onChange={(e) => setForm({ ...form, next_run: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Deskripsi (opsional)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <button
          onClick={handleSubmit}
          disabled={
            loading || !form.account_id || !form.category_id || !form.amount
          }
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {loading ? 'Menyimpan...' : 'Tambah Transaksi Berulang'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {recurring.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Belum ada transaksi berulang</p>
          </div>
        ) : (
          recurring.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {getCategoryIcon(rec.category_id)}{' '}
                      {getCategoryName(rec.category_id)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getAccountName(rec.account_id)} •{' '}
                      <span className="capitalize">
                        {frequencyLabels[rec.frequency]}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(rec.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p
                className={`text-lg font-bold ${
                  rec.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {rec.type === 'income' ? '+' : '-'} Rp{' '}
                {Number(rec.amount).toLocaleString('id-ID')}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Selanjutnya: {format(new Date(rec.next_run), 'dd MMM yyyy')}
              </p>

              {rec.description && (
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              )}

              <div className="mt-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    rec.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {rec.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}