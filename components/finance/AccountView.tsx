'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'credit';
  initial_balance: number;
  is_active: boolean;
}

interface AccountViewProps {
  accounts: Account[];
  loading: boolean;
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AccountView({
  accounts,
  loading,
  onAdd,
  onDelete,
}: AccountViewProps) {
  const [form, setForm] = useState({
    name: '',
    type: 'cash' as 'cash' | 'bank' | 'ewallet' | 'credit',
    initial_balance: '',
  });

  const handleSubmit = async () => {
    if (!form.name) return;

    await onAdd({
      name: form.name,
      type: form.type,
      currency: 'IDR',
      initial_balance: parseFloat(form.initial_balance || '0'),
      is_active: true,
    });

    setForm({ name: '', type: 'cash', initial_balance: '' });
  };

  const accountTypeLabels: Record<string, string> = {
    cash: 'Tunai',
    bank: 'Bank',
    ewallet: 'E-Wallet',
    credit: 'Kartu Kredit',
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 text-gray-900">Tambah Akun</h3>

        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nama Akun (BCA, Dompet, GoPay)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <select
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as any })
          }
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="cash">Tunai</option>
          <option value="bank">Bank</option>
          <option value="ewallet">E-Wallet</option>
          <option value="credit">Kartu Kredit</option>
        </select>

        <input
          type="number"
          value={form.initial_balance}
          onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
          placeholder="Saldo Awal (Rp)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !form.name}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {loading ? 'Menyimpan...' : 'Tambah Akun'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Belum ada akun</p>
          </div>
        ) : (
          accounts.map((acc) => (
            <div key={acc.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{acc.name}</h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        acc.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {acc.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 capitalize mb-2">
                    {accountTypeLabels[acc.type]}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    Rp {Number(acc.initial_balance).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">Saldo awal</p>
                </div>
                <button
                  onClick={() => onDelete(acc.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}