'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Search,
  X,
  Key,
  RefreshCw,
  Edit2,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';

interface Password {
  id: string;
  service: string;
  username: string;
  password: string;
  notes: string | null;
  strength: number;
  created_at: string;
  updated_at: string;
}

// Password Generator Function
const generatePassword = (length: number = 16): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + numbers + symbols;

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  // Ensure at least one of each type
  password += lowercase[array[0] % lowercase.length];
  password += uppercase[array[1] % uppercase.length];
  password += numbers[array[2] % numbers.length];
  password += symbols[array[3] % symbols.length];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[array[i] % allChars.length];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

// Password Strength Calculator
const calculateStrength = (password: string): number => {
  if (!password) return 0;

  let score = 0;

  // Length score (max 40)
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety (max 60)
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  return Math.min(score, 100);
};

const getStrengthColor = (strength: number): string => {
  if (strength < 25) return 'bg-red-500';
  if (strength < 50) return 'bg-orange-500';
  if (strength < 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getStrengthLabel = (strength: number): string => {
  if (strength < 25) return 'Sangat Lemah';
  if (strength < 50) return 'Lemah';
  if (strength < 75) return 'Cukup';
  return 'Kuat';
};

export default function PasswordsPage() {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    service: '',
    username: '',
    password: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState<Password | null>(null);

  useEffect(() => {
    loadPasswords();
  }, [searchQuery]);

  const loadPasswords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/passwords?${params}`);
      const data = await res.json();
      setPasswords(data.passwords || []);
    } catch (error) {
      console.error('Error loading passwords:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.service.trim() || !form.username.trim() || !form.password.trim())
      return;

    try {
      const strength = calculateStrength(form.password);

      const res = await fetch('/api/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, strength }),
      });

      if (res.ok) {
        setForm({ service: '', username: '', password: '', notes: '' });
        loadPasswords();
      }
    } catch (error) {
      console.error('Error creating password:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editForm) return;

    try {
      const strength = calculateStrength(editForm.password);

      const res = await fetch('/api/passwords', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, strength }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditForm(null);
        loadPasswords();
      }
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus password ini?')) return;

    try {
      const res = await fetch(`/api/passwords?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadPasswords();
    } catch (error) {
      console.error('Error deleting password:', error);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying:', error);
    }
  };

  const handleGenerate = () => {
    const newPassword = generatePassword(16);
    setForm({ ...form, password: newPassword });
  };

  const handleGenerateEdit = () => {
    if (!editForm) return;
    const newPassword = generatePassword(16);
    setEditForm({ ...editForm, password: newPassword });
  };

  const toggleShowPassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (password: Password) => {
    setEditingId(password.id);
    setEditForm({ ...password });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const currentStrength = calculateStrength(form.password);
  const editStrength = editForm ? calculateStrength(editForm.password) : 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Password Manager</h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola password Anda dengan aman
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari layanan, username, atau catatan..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Add Password Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Key size={20} />
              Tambah Password Baru
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                placeholder="Nama layanan (Gmail, Facebook, dll)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />

              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Username / Email"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />

              <div className="relative">
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <button
                  onClick={handleGenerate}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  title="Generate Password"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              {form.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Shield size={14} />
                      Kekuatan Password:
                    </span>
                    <span className="font-medium text-gray-900">
                      {getStrengthLabel(currentStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getStrengthColor(
                        currentStrength
                      )}`}
                      style={{ width: `${currentStrength}%` }}
                    />
                  </div>
                </div>
              )}

              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan (opsional)"
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />

              <button
                onClick={handleSubmit}
                disabled={
                  !form.service.trim() ||
                  !form.username.trim() ||
                  !form.password.trim()
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Simpan Password
              </button>
            </div>
          </div>

          {/* Passwords List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : passwords.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Key size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">
                {searchQuery
                  ? 'Tidak ada password yang ditemukan'
                  : 'Belum ada password tersimpan'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {passwords.map((pass) => (
                <div
                  key={pass.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  {editingId === pass.id && editForm ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.service}
                        onChange={(e) =>
                          setEditForm({ ...editForm, service: e.target.value })
                        }
                        placeholder="Nama layanan"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />

                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) =>
                          setEditForm({ ...editForm, username: e.target.value })
                        }
                        placeholder="Username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />

                      <div className="relative">
                        <input
                          type="text"
                          value={editForm.password}
                          onChange={(e) =>
                            setEditForm({ ...editForm, password: e.target.value })
                          }
                          placeholder="Password"
                          className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        <button
                          onClick={handleGenerateEdit}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>

                      {editForm.password && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Kekuatan:</span>
                            <span className="font-medium">
                              {getStrengthLabel(editStrength)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${getStrengthColor(
                                editStrength
                              )}`}
                              style={{ width: `${editStrength}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, notes: e.target.value })
                        }
                        placeholder="Catatan"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdate}
                          className="flex-1 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {pass.service}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${getStrengthColor(
                                  pass.strength
                                )}`}
                                style={{ width: `${pass.strength}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {getStrengthLabel(pass.strength)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => startEdit(pass)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(pass.id)}
                            className="p-1.5 text-red-600 hover:text-red-700 rounded hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-gray-600 text-xs">Username:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 truncate max-w-[200px]">
                              {pass.username}
                            </span>
                            <button
                              onClick={() =>
                                handleCopy(pass.username, `user-${pass.id}`)
                              }
                              className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                              title="Copy Username"
                            >
                              {copiedId === `user-${pass.id}` ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded">
                          <span className="text-gray-600 text-xs">Password:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-mono text-sm">
                              {showPasswords[pass.id]
                                ? pass.password
                                : '••••••••••••'}
                            </span>
                            <button
                              onClick={() => toggleShowPassword(pass.id)}
                              className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                              title={
                                showPasswords[pass.id]
                                  ? 'Hide Password'
                                  : 'Show Password'
                              }
                            >
                              {showPasswords[pass.id] ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleCopy(pass.password, `pass-${pass.id}`)
                              }
                              className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                              title="Copy Password"
                            >
                              {copiedId === `pass-${pass.id}` ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        {pass.notes && (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-gray-600 mb-1">Catatan:</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                              {pass.notes}
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-gray-400 pt-1">
                          Dibuat: {format(new Date(pass.created_at), 'dd MMM yyyy HH:mm')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}