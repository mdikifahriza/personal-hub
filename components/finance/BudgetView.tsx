'use client';

import { useState, useMemo } from 'react';
import { Plus, PiggyBank, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface Budget {
  id: string;
  category_id: string;
  monthly_limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
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
  date: string;
}

interface BudgetViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  loading: boolean;
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function BudgetView({
  budgets,
  categories,
  transactions,
  loading,
  onAdd,
  onDelete,
}: BudgetViewProps) {
  const [form, setForm] = useState({
    category_id: '',
    monthly_limit: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
  });

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || 'Unknown';
  const getCategoryIcon = (id: string) =>
    categories.find((c) => c.id === id)?.icon || '💰';

  const handleSubmit = async () => {
    if (!form.category_id || !form.monthly_limit) return;

    await onAdd({
      category_id: form.category_id,
      monthly_limit: parseFloat(form.monthly_limit),
      period: form.period,
      start_date: format(new Date(), 'yyyy-MM-dd'),
    });

    setForm({ category_id: '', monthly_limit: '', period: 'monthly' });
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const periodLabels = {
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
  };

  // Calculate spending for each budget
  const budgetsWithSpending = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category_id === budget.category_id &&
            new Date(t.date) >= startOfMonth(new Date()) &&
            new Date(t.date) <= endOfMonth(new Date())
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = (spent / Number(budget.monthly_limit)) * 100;
      const isOverBudget = percentage > 100;

      return { ...budget, spent, percentage, isOverBudget };
    });
  }, [budgets, transactions]);

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
          <PiggyBank size={18} />
          Atur Budget
        </h3>

        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Pilih Kategori Pengeluaran</option>
          {expenseCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={form.monthly_limit}
          onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })}
          placeholder="Limit Bulanan (Rp)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <select
          value={form.period}
          onChange={(e) => setForm({ ...form, period: e.target.value as any })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
          <option value="yearly">Tahunan</option>
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.category_id || !form.monthly_limit}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {loading ? 'Menyimpan...' : 'Tambah Budget'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {budgetsWithSpending.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Belum ada budget</p>
          </div>
        ) : (
          budgetsWithSpending.map((budget) => (
            <div
              key={budget.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {getCategoryIcon(budget.category_id)}{' '}
                    {getCategoryName(budget.category_id)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {periodLabels[budget.period]}
                  </p>
                </div>
                <button
                  onClick={() => onDelete(budget.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span
                    className={
                      budget.isOverBudget
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-700'
                    }
                  >
                    Rp {budget.spent.toLocaleString('id-ID')}
                  </span>
                  <span className="text-gray-500">
                    / Rp {Number(budget.monthly_limit).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budget.isOverBudget
                        ? 'bg-red-600'
                        : budget.percentage > 75
                        ? 'bg-orange-500'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <p
                    className={`text-xs ${
                      budget.isOverBudget
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    {budget.percentage.toFixed(1)}%{' '}
                    {budget.isOverBudget && 'Over Budget!'}
                  </p>
                  {budget.isOverBudget && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      Melebihi Rp{' '}
                      {(budget.spent - Number(budget.monthly_limit)).toLocaleString(
                        'id-ID'
                      )}
                    </span>
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