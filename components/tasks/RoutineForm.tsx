'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface RoutineFormProps {
  onSuccess: () => void;
}

export default function RoutineForm({ onSuccess }: RoutineFormProps) {
  const [form, setForm] = useState({
    title: '',
    time_of_day: '08:00',
    days_of_week: [1, 2, 3, 4, 5] as number[],
  });
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: number) => {
    if (form.days_of_week.includes(day)) {
      setForm({ ...form, days_of_week: form.days_of_week.filter((d) => d !== day) });
    } else {
      setForm({ ...form, days_of_week: [...form.days_of_week, day].sort() });
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || form.days_of_week.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/tasks?type=routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          time_of_day: form.time_of_day,
          days_of_week: form.days_of_week,
          is_active: true,
        }),
      });

      if (res.ok) {
        setForm({
          title: '',
          time_of_day: '08:00',
          days_of_week: [1, 2, 3, 4, 5],
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding routine:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="font-medium text-gray-900 mb-4">Tambah Rutinitas Baru</h2>

      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Nama rutinitas (contoh: Olahraga pagi)"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm mb-3"
      />

      <input
        type="time"
        value={form.time_of_day}
        onChange={(e) => setForm({ ...form, time_of_day: e.target.value })}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm mb-3"
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Hari</label>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day, idx) => {
            const dayNum = idx === 0 ? 7 : idx;
            return (
              <button
                key={dayNum}
                onClick={() => toggleDay(dayNum)}
                type="button"
                className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                  form.days_of_week.includes(dayNum)
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !form.title.trim() || form.days_of_week.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={18} />
        {loading ? 'Menyimpan...' : 'Tambah Rutinitas'}
      </button>
    </div>
  );
}