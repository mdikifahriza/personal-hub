'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import TasksList from '@/components/tasks/TasksList';
import TaskForm from '@/components/tasks/TaskForm';
import RoutinesList from '@/components/tasks/RoutinesList';
import RoutineForm from '@/components/tasks/RoutineForm';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'routines'>('tasks');
  const [tasks, setTasks] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, routinesRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tasks?type=routines'),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      if (routinesRes.ok) {
        const routinesData = await routinesRes.json();
        setRoutines(routinesData.routines || []);
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
            <p className="text-sm text-gray-600 mt-1">Kelola tugas harian dan rutinitas Anda</p>
          </div>

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
              <TaskForm onSuccess={loadData} />
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