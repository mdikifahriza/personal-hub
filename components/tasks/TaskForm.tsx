'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AccountOption {
  id: string;
  name: string;
  is_active?: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

interface TaskFormProps {
  onSuccess: () => void;
  accounts: AccountOption[];
  categories: CategoryOption[];
}

type Priority = 'high' | 'medium' | 'low';

export default function TaskForm({ onSuccess, accounts, categories }: TaskFormProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    due_date: '',
    client_name: '',
    expected_amount: '',
    agreed_amount: '',
    account_id: '',
    category_id: '',
    reminder_at: '',
    reminder_note: '',
  });
  const [loading, setLoading] = useState(false);

  const handlePriorityChange = (value: string) => {
    if (value === 'high' || value === 'medium' || value === 'low') {
      setForm((prev) => ({ ...prev, priority: value }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          priority: form.priority,
          due_date: form.due_date || null,
          reminder_at: form.reminder_at || null,
          reminder_note: form.reminder_note || null,
          finance: {
            client_name: form.client_name || null,
            expected_amount: form.expected_amount ? Number(form.expected_amount) : null,
            agreed_amount: form.agreed_amount ? Number(form.agreed_amount) : null,
            account_id: form.account_id || null,
            category_id: form.category_id || null,
          },
        }),
      });

      if (res.ok) {
        setForm({
          title: '',
          description: '',
          priority: 'medium',
          due_date: '',
          client_name: '',
          expected_amount: '',
          agreed_amount: '',
          account_id: '',
          category_id: '',
          reminder_at: '',
          reminder_note: '',
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeAccounts = accounts.filter((account) => account.is_active !== false);
  const incomeCategories = categories.filter((category) => category.type === 'income');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="font-medium text-gray-900 mb-4">Tambah Tugas Kerja Baru</h2>

      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
        placeholder="Judul tugas"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm mb-3"
      />

      <textarea
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        placeholder="Deskripsi (opsional)"
        rows={2}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm mb-3"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <select
          value={form.priority}
          onChange={(e) => handlePriorityChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        >
          <option value="low">Prioritas Rendah</option>
          <option value="medium">Prioritas Sedang</option>
          <option value="high">Prioritas Tinggi</option>
        </select>

        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          value={form.client_name}
          onChange={(e) => setForm((prev) => ({ ...prev, client_name: e.target.value }))}
          placeholder="Nama klien (opsional)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        />

        <input
          type="date"
          value={form.reminder_at}
          onChange={(e) => setForm((prev) => ({ ...prev, reminder_at: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="number"
          min="0"
          value={form.expected_amount}
          onChange={(e) => setForm((prev) => ({ ...prev, expected_amount: e.target.value }))}
          placeholder="Estimasi nilai kerja (Rp)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        />

        <input
          type="number"
          min="0"
          value={form.agreed_amount}
          onChange={(e) => setForm((prev) => ({ ...prev, agreed_amount: e.target.value }))}
          placeholder="Nilai deal/final (Rp)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <select
          value={form.account_id}
          onChange={(e) => setForm((prev) => ({ ...prev, account_id: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        >
          <option value="">Akun Penerima (opsional)</option>
          {activeAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>

        <select
          value={form.category_id}
          onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        >
          <option value="">Kategori Income (opsional)</option>
          {incomeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon || '💰'} {category.name}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={form.reminder_note}
        onChange={(e) => setForm((prev) => ({ ...prev, reminder_note: e.target.value }))}
        placeholder="Catatan pengingat (opsional)"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !form.title.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={18} />
        {loading ? 'Menyimpan...' : 'Tambah Tugas'}
      </button>
    </div>
  );
}

