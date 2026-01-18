'use client';

import { useState } from 'react';
import { Plus, ArrowLeftRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Account {
  id: string;
  name: string;
  is_active: boolean;
}

interface Transfer {
  id: string;
  from_account: string;
  to_account: string;
  amount: number;
  transfer_date: string;
  note: string | null;
}

interface TransferViewProps {
  transfers: Transfer[];
  accounts: Account[];
  loading: boolean;
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TransferView({
  transfers,
  accounts,
  loading,
  onAdd,
  onDelete,
}: TransferViewProps) {
  const [form, setForm] = useState({
    from_account: '',
    to_account: '',
    amount: '',
    transfer_date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });

  const getAccountName = (id: string) =>
    accounts.find((a) => a.id === id)?.name || 'Unknown';

  const handleSubmit = async () => {
    if (!form.from_account || !form.to_account || !form.amount) return;

    await onAdd({
      from_account: form.from_account,
      to_account: form.to_account,
      amount: parseFloat(form.amount),
      transfer_date: form.transfer_date,
      note: form.note || null,
    });

    setForm({
      from_account: '',
      to_account: '',
      amount: '',
      transfer_date: format(new Date(), 'yyyy-MM-dd'),
      note: '',
    });
  };

  const activeAccounts = accounts.filter((a) => a.is_active);

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900">
          <ArrowLeftRight size={18} />
          Transfer Antar Akun
        </h3>

        <select
          value={form.from_account}
          onChange={(e) => setForm({ ...form, from_account: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Dari Akun</option>
          {activeAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <select
          value={form.to_account}
          onChange={(e) => setForm({ ...form, to_account: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Ke Akun</option>
          {activeAccounts
            .filter((acc) => acc.id !== form.from_account)
            .map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
        </select>

        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Jumlah (Rp)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <input
          type="date"
          value={form.transfer_date}
          onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <input
          type="text"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Catatan (opsional)"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <button
          onClick={handleSubmit}
          disabled={
            loading || !form.from_account || !form.to_account || !form.amount
          }
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {loading ? 'Menyimpan...' : 'Tambah Transfer'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {transfers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Belum ada transfer</p>
          </div>
        ) : (
          transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {getAccountName(transfer.from_account)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ke {getAccountName(transfer.to_account)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(transfer.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-lg font-bold text-blue-600">
                Rp {Number(transfer.amount).toLocaleString('id-ID')}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(transfer.transfer_date), 'dd MMM yyyy')}
              </p>

              {transfer.note && (
                <p className="text-sm text-gray-600 mt-1">{transfer.note}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}