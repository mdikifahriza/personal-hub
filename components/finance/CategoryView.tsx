'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

interface CategoryViewProps {
  categories: Category[];
  loading: boolean;
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CategoryView({
  categories,
  loading,
  onAdd,
  onDelete,
}: CategoryViewProps) {
  const [form, setForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: '💰',
    color: '#3b82f6',
  });

  const handleSubmit = async () => {
    if (!form.name) return;

    await onAdd({
      name: form.name,
      type: form.type,
      icon: form.icon,
      color: form.color,
    });

    setForm({ name: '', type: 'expense', icon: '💰', color: '#3b82f6' });
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 text-gray-900">Tambah Kategori</h3>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setForm({ ...form, type: 'income' })}
            className={`py-2 rounded-lg font-medium transition-colors ${
              form.type === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setForm({ ...form, type: 'expense' })}
            className={`py-2 rounded-lg font-medium transition-colors ${
              form.type === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pengeluaran
          </button>
        </div>

        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nama Kategori"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Icon (Emoji)</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="💰"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              maxLength={2}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Warna</label>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full h-10 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.name}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {loading ? 'Menyimpan...' : 'Tambah Kategori'}
        </button>
      </div>

      {/* Income Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 text-green-600">Kategori Pemasukan</h3>
        {incomeCategories.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada kategori pemasukan</p>
        ) : (
          <div className="space-y-2">
            {incomeCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: cat.color }}
                  />
                  <button
                    onClick={() => onDelete(cat.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 text-red-600">Kategori Pengeluaran</h3>
        {expenseCategories.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada kategori pengeluaran</p>
        ) : (
          <div className="space-y-2">
            {expenseCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: cat.color }}
                  />
                  <button
                    onClick={() => onDelete(cat.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}