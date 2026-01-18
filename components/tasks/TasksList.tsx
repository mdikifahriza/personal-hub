'use client';

import { Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface TasksListProps {
  tasks: Task[];
  onUpdate: () => void;
  loading: boolean;
}

export default function TasksList({ tasks, onUpdate, loading }: TasksListProps) {
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
      {/* Pending Tasks */}
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
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="flex-shrink-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Selesai ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-4 opacity-60">
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