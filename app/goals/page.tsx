'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, endOfMonth, endOfQuarter, format, parseISO } from 'date-fns';
import Sidebar from '@/components/Sidebar';

type Cadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  cadence: Cadence;
  start_date: string;
  end_date: string;
  is_active: boolean;
  achieved_amount: number;
  remaining_amount: number;
  progress_percent: number;
}

const CADENCE_OPTIONS: { value: Cadence; label: string }[] = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'quarterly', label: 'Kuartalan' },
  { value: 'custom', label: 'Custom' },
];

function calculateEndDateByCadence(startDate: string, cadence: Cadence): string {
  const start = parseISO(startDate);

  switch (cadence) {
    case 'daily':
      return format(start, 'yyyy-MM-dd');
    case 'weekly':
      return format(addDays(start, 6), 'yyyy-MM-dd');
    case 'monthly':
      return format(endOfMonth(start), 'yyyy-MM-dd');
    case 'quarterly':
      return format(endOfQuarter(start), 'yyyy-MM-dd');
    case 'custom':
    default:
      return format(addMonths(start, 3), 'yyyy-MM-dd');
  }
}

export default function GoalsPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: 'Target 100 Juta',
    description: 'Goal pemasukan dari pekerjaan',
    target_amount: '100000000',
    cadence: 'custom' as Cadence,
    start_date: today,
    end_date: calculateEndDateByCadence(today, 'custom'),
  });

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const activeGoals = useMemo(() => goals.filter((goal) => goal.is_active), [goals]);

  const summary = useMemo(() => {
    const target = activeGoals.reduce((sum, goal) => sum + Number(goal.target_amount || 0), 0);
    const achieved = activeGoals.reduce((sum, goal) => sum + Number(goal.achieved_amount || 0), 0);
    const remaining = Math.max(target - achieved, 0);
    const progress = target > 0 ? (achieved / target) * 100 : 0;

    return { target, achieved, remaining, progress };
  }, [activeGoals]);

  const handleCadenceChange = (cadence: Cadence) => {
    setForm((prev) => ({
      ...prev,
      cadence,
      end_date: calculateEndDateByCadence(prev.start_date, cadence),
    }));
  };

  const handleStartDateChange = (startDate: string) => {
    setForm((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: calculateEndDateByCadence(startDate, prev.cadence),
    }));
  };

  const handleCreateGoal = async () => {
    if (!form.title.trim() || !form.target_amount) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description || null,
          target_amount: Number(form.target_amount),
          cadence: form.cadence,
          start_date: form.start_date,
          end_date: form.end_date,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        window.alert(result.error || 'Gagal membuat goal.');
        return;
      }

      await loadGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      window.alert('Terjadi error saat membuat goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleGoalActive = async (goal: Goal) => {
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goal.id,
          is_active: !goal.is_active,
        }),
      });

      if (res.ok) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Error toggling goal:', error);
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    if (!confirm(`Nonaktifkan goal "${goal.title}"?`)) return;

    try {
      const res = await fetch(`/api/goals?id=${goal.id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-0">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Goals Pendapatan</h1>
            <p className="text-sm text-gray-600 mt-1">
              Atur target harian, mingguan, bulanan, kuartalan, atau custom.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                <p className="text-xs text-green-700 mb-1">Target Aktif</p>
                <p className="text-lg font-semibold text-green-800">
                  Rp {summary.target.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-700 mb-1">Tercapai</p>
                <p className="text-lg font-semibold text-blue-800">
                  Rp {summary.achieved.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                <p className="text-xs text-amber-700 mb-1">Sisa</p>
                <p className="text-lg font-semibold text-amber-800">
                  Rp {summary.remaining.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, summary.progress)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Progress total active goals: {summary.progress.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Tambah Goal</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Judul goal"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <input
                type="number"
                min="1"
                value={form.target_amount}
                onChange={(e) => setForm((prev) => ({ ...prev, target_amount: e.target.value }))}
                placeholder="Target amount (Rp)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Deskripsi (opsional)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <select
                value={form.cadence}
                onChange={(e) => handleCadenceChange(e.target.value as Cadence)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {CADENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />

              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <button
              onClick={handleCreateGoal}
              disabled={submitting || !form.title.trim() || !form.target_amount}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Goal'}
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : goals.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500">
                Belum ada goal.
              </div>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {goal.cadence} | {goal.start_date} - {goal.end_date}
                      </p>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleGoalActive(goal)}
                        className={`text-xs px-2.5 py-1.5 rounded border ${
                          goal.is_active
                            ? 'border-green-500 text-green-700 bg-green-50'
                            : 'border-gray-300 text-gray-700'
                        }`}
                      >
                        {goal.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal)}
                        className="text-xs px-2.5 py-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Nonaktifkan
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Number(goal.progress_percent || 0))}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Rp {Number(goal.achieved_amount || 0).toLocaleString('id-ID')} / Rp{' '}
                      {Number(goal.target_amount || 0).toLocaleString('id-ID')} (
                      {Number(goal.progress_percent || 0).toFixed(2)}%)
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

