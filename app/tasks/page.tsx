'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import TasksList from '@/components/tasks/TasksList';
import TaskForm from '@/components/tasks/TaskForm';
import RoutinesList from '@/components/tasks/RoutinesList';
import RoutineForm from '@/components/tasks/RoutineForm';

interface Account {
  id: string;
  name: string;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

interface GoalProgress {
  id: string;
  title: string;
  target_amount: number;
  achieved_amount: number;
  remaining_amount: number;
  progress_percent: number;
  end_date: string;
}

interface TaskFinance {
  client_name: string | null;
  expected_amount: number | null;
  agreed_amount: number | null;
  invoice_status: 'not_sent' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  paid_amount: number | null;
  paid_at: string | null;
  account_id: string | null;
  category_id: string | null;
  transaction_id?: string | null;
}

interface TaskReminder {
  id: string;
  reminder_type: 'due_date' | 'invoice_follow_up' | 'payment_follow_up' | 'custom';
  remind_at: string;
  note: string | null;
  is_done: boolean;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  finance: TaskFinance | null;
  reminders: TaskReminder[];
}

interface RoutineItem {
  id: string;
  title: string;
  time_of_day: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'routines'>('tasks');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeGoal, setActiveGoal] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, routinesRes, accountsRes, categoriesRes, goalsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tasks?type=routines'),
        fetch('/api/accounts'),
        fetch('/api/categories'),
        fetch('/api/goals?active=true'),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (routinesRes.ok) {
        const routinesData = await routinesRes.json();
        setRoutines(routinesData.routines || []);
      }

      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        setAccounts(accountsData.accounts || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        const goals = goalsData.goals || [];
        setActiveGoal(goals[0] || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tugas & Rutinitas</h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola pekerjaan, reminder, dan progres target pendapatan
            </p>
          </div>

          {activeGoal && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Goal Aktif</p>
                  <h2 className="text-lg font-semibold text-gray-900">{activeGoal.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Terkumpul Rp {Number(activeGoal.achieved_amount).toLocaleString('id-ID')} dari
                    target Rp {Number(activeGoal.target_amount).toLocaleString('id-ID')}
                  </p>
                </div>

                <Link
                  href="/goals"
                  className="text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Lihat Detail Goal
                </Link>
              </div>

              <div className="mt-3 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Number(activeGoal.progress_percent || 0))}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Progress {Number(activeGoal.progress_percent || 0).toFixed(2)}% | Sisa Rp{' '}
                {Number(activeGoal.remaining_amount).toLocaleString('id-ID')} | Deadline{' '}
                {activeGoal.end_date}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tugas
            </button>
            <button
              onClick={() => setActiveTab('routines')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'routines'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rutinitas
            </button>
          </div>

          {/* Content */}
          {activeTab === 'tasks' ? (
            <div className="space-y-6">
              <TaskForm onSuccess={loadData} accounts={accounts} categories={categories} />
              <TasksList tasks={tasks} onUpdate={loadData} loading={loading} />
            </div>
          ) : (
            <div className="space-y-6">
              <RoutineForm onSuccess={loadData} />
              <RoutinesList routines={routines} onUpdate={loadData} loading={loading} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
