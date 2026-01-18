'use client';

import { Trash2, CheckCircle2, Clock } from 'lucide-react';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface Routine {
  id: string;
  title: string;
  time_of_day: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
}

interface RoutinesListProps {
  routines: Routine[];
  onUpdate: () => void;
  loading: boolean;
}

export default function RoutinesList({ routines, onUpdate, loading }: RoutinesListProps) {
  const toggleActive = async (routine: Routine) => {
    try {
      const res = await fetch('/api/tasks?type=routines', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: routine.id,
          is_active: !routine.is_active,
        }),
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error toggling routine:', error);
    }
  };

  const deleteRoutine = async (id: string) => {
    if (!confirm('Hapus rutinitas ini?')) return;

    try {
      const res = await fetch(`/api/tasks?type=routines&id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      {routines.map((routine) => (
        <div
          key={routine.id}
          className={`bg-white rounded-lg border border-gray-200 p-4 ${
            !routine.is_active && 'opacity-50'
          }`}
        >
          <div className="flex gap-3">
            <button onClick={() => toggleActive(routine)} className="flex-shrink-0 mt-1">
              <CheckCircle2
                size={20}
                className={routine.is_active ? 'text-green-600' : 'text-gray-400'}
              />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-gray-900">{routine.title}</h4>
                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Clock size={14} />
                <span>{routine.time_of_day}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {routine.days_of_week.sort().map((day) => (
                  <span
                    key={day}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200"
                  >
                    {DAYS[day === 7 ? 0 : day]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {routines.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Belum ada rutinitas</p>
        </div>
      )}
    </div>
  );
}