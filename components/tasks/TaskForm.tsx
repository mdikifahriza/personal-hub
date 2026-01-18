'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface TaskFormProps {
  onSuccess: () => void;
}

export default function TaskForm({ onSuccess }: TaskFormProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    due_date: '',
  });
  const [loading, setLoading] = useState(false);

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
        }),
      });

      if (res.ok) {
        setForm({
          title: '',
          description: '',
          priority: 'medium',
          due_date: '',
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="font-medium text-gray-900 mb-4">Tambah Tugas Baru</h2>

      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Judul tugas"
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm mb-3"
      />

      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Deskripsi (opsional)"
        rows={2}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm mb-3"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        >
          <option value="low">Prioritas Rendah</option>
          <option value="medium">Prioritas Sedang</option>
          <option value="high">Prioritas Tinggi</option>
        </select>

        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
        />
      </div>

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