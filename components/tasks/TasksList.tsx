'use client';

import { useState } from 'react';
import { Trash2, CheckCircle2, Circle, AlertCircle, Wallet } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

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

interface Task {
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

interface TasksListProps {
  tasks: Task[];
  onUpdate: () => void;
  loading: boolean;
}

export default function TasksList({ tasks, onUpdate, loading }: TasksListProps) {
  const [payingTaskId, setPayingTaskId] = useState<string | null>(null);

  const toggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        }),
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Hapus tugas ini?')) return;

    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const markAsPaid = async (task: Task) => {
    const defaultAmount =
      task.finance?.agreed_amount ?? task.finance?.expected_amount ?? null;
    const amountInput = window.prompt(
      'Masukkan nominal pembayaran (Rp):',
      defaultAmount ? String(defaultAmount) : ''
    );

    if (amountInput === null) return;

    const paidAmount = Number(amountInput);
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      window.alert('Nominal pembayaran tidak valid.');
      return;
    }

    setPayingTaskId(task.id);
    try {
      const res = await fetch('/api/tasks/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          paid_amount: paidAmount,
          paid_date: new Date().toISOString().slice(0, 10),
          account_id: task.finance?.account_id || null,
          category_id: task.finance?.category_id || null,
          description: `Pembayaran task: ${task.title}`,
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        window.alert(result.error || 'Gagal menandai task sebagai dibayar.');
        return;
      }

      onUpdate();
    } catch (error) {
      console.error('Error marking task as paid:', error);
      window.alert('Terjadi error saat menandai task sebagai dibayar.');
    } finally {
      setPayingTaskId(null);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
  };

  const getNextReminder = (task: Task) => {
    const upcoming = (task.reminders || [])
      .filter((reminder) => !reminder.is_done)
      .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime());

    return upcoming[0] || null;
  };

  const priorityColor = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    low: 'text-green-600 bg-green-50 border-green-200',
  };

  const priorityLabel = {
    high: 'Tinggi',
    medium: 'Sedang',
    low: 'Rendah',
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Belum Selesai ({pendingTasks.length})
          </h3>
          <div className="space-y-3">
            {pendingTasks.map((task) => {
              const isOverdue =
                task.due_date &&
                isPast(new Date(task.due_date)) &&
                !isToday(new Date(task.due_date));
              const nextReminder = getNextReminder(task);
              const hasPaymentInfo = Boolean(
                task.finance?.expected_amount ||
                  task.finance?.agreed_amount ||
                  task.finance?.client_name
              );
              const isPaid = task.finance?.payment_status === 'paid';

              return (
                <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleComplete(task)}
                      className="flex-shrink-0 mt-1"
                    >
                      <Circle size={20} className="text-gray-400 hover:text-gray-900" />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          {!isPaid && (
                            <button
                              onClick={() => markAsPaid(task)}
                              disabled={payingTaskId === task.id}
                              className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-60"
                            >
                              {payingTaskId === task.id ? 'Menyimpan...' : 'Tandai Dibayar'}
                            </button>
                          )}

                          <button
                            onClick={() => deleteTask(task.id)}
                            className="flex-shrink-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}

                      {hasPaymentInfo && (
                        <div className="mb-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                          <p className="text-xs text-gray-500">
                            Klien: {task.finance?.client_name || '-'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Estimasi: {formatCurrency(task.finance?.expected_amount)} | Deal:{' '}
                            {formatCurrency(task.finance?.agreed_amount)}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded border ${
                            priorityColor[task.priority]
                          }`}
                        >
                          {priorityLabel[task.priority]}
                        </span>

                        {task.due_date && (
                          <span
                            className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${
                              isOverdue
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : isToday(new Date(task.due_date))
                                ? 'bg-orange-100 text-orange-700 border-orange-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {isOverdue && <AlertCircle size={12} />}
                            {format(new Date(task.due_date), 'dd MMM yyyy')}
                          </span>
                        )}

                        {task.finance && (
                          <span
                            className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${
                              task.finance.payment_status === 'paid'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : task.finance.payment_status === 'partial'
                                ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            <Wallet size={12} />
                            {task.finance.payment_status === 'paid'
                              ? 'Sudah Dibayar'
                              : task.finance.payment_status === 'partial'
                              ? 'Dibayar Sebagian'
                              : 'Belum Dibayar'}
                          </span>
                        )}

                        {nextReminder && (
                          <span className="text-xs px-2 py-1 rounded border bg-blue-50 text-blue-700 border-blue-200">
                            Reminder: {format(new Date(nextReminder.remind_at), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Selesai ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-gray-200 p-4 opacity-70"
              >
                <div className="flex gap-3">
                  <button onClick={() => toggleComplete(task)} className="flex-shrink-0 mt-1">
                    <CheckCircle2 size={20} className="text-green-600" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 line-through">{task.title}</h4>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="flex-shrink-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {task.finance?.payment_status === 'paid' && (
                      <p className="text-xs text-green-700 mt-1">
                        Dibayar: {formatCurrency(task.finance.paid_amount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada tugas</p>
        </div>
      )}
    </div>
  );
}
