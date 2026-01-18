'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/finance/DashboardView';
import TransactionView from '@/components/finance/TransactionView';
import AccountView from '@/components/finance/AccountView';
import CategoryView from '@/components/finance/CategoryView';
import TransferView from '@/components/finance/TransferView';
import RecurringView from '@/components/finance/RecurringView';
import BudgetView from '@/components/finance/BudgetView';

type View =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'categories'
  | 'transfers'
  | 'recurring'
  | 'budgets';

export default function FinancePage() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        accountsRes,
        categoriesRes,
        transactionsRes,
        transfersRes,
        recurringRes,
        budgetsRes,
      ] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/categories'),
        fetch('/api/transactions'),
        fetch('/api/transfers'),
        fetch('/api/recurring'),
        fetch('/api/budgets'),
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories || []);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }

      if (transfersRes.ok) {
        const data = await transfersRes.json();
        setTransfers(data.transfers || []);
      }

      if (recurringRes.ok) {
        const data = await recurringRes.json();
        setRecurring(data.recurring || []);
      }

      if (budgetsRes.ok) {
        const data = await budgetsRes.json();
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Account handlers
  const handleAddAccount = async (data: any) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Hapus akun ini?')) return;
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  // Category handlers
  const handleAddCategory = async (data: any) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Transaction handlers
  const handleAddTransaction = async (data: any) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Transfer handlers
  const handleAddTransfer = async (data: any) => {
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error adding transfer:', error);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (!confirm('Hapus transfer ini?')) return;
    try {
      const res = await fetch(`/api/transfers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error deleting transfer:', error);
    }
  };

  // Recurring handlers
  const handleAddRecurring = async (data: any) => {
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error adding recurring:', error);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm('Hapus transaksi berulang ini?')) return;
    try {
      const res = await fetch(`/api/recurring?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error deleting recurring:', error);
    }
  };

  // Budget handlers
  const handleAddBudget = async (data: any) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Hapus budget ini?')) return;
    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAllData();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const views: View[] = [
    'dashboard',
    'transactions',
    'accounts',
    'categories',
    'transfers',
    'recurring',
    'budgets',
  ];

  const viewLabels: Record<View, string> = {
    dashboard: 'Dashboard',
    transactions: 'Transaksi',
    accounts: 'Akun',
    categories: 'Kategori',
    transfers: 'Transfer',
    recurring: 'Berulang',
    budgets: 'Budget',
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6 lg:ml-0">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Keuangan</h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola keuangan pribadi Anda
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <select
              value={activeView}
              onChange={(e) => setActiveView(e.target.value as View)}
              className="w-full px-4 py-3 text-sm font-medium text-gray-900 bg-transparent border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
            >
              {views.map((view) => (
                <option key={view} value={view}>
                  {viewLabels[view]}
                </option>
              ))}
            </select>
          </div>

          {/* View Content */}
          {activeView === 'dashboard' && (
            <DashboardView
              accounts={accounts}
              transactions={transactions}
              recurring={recurring}
              categories={categories}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionView
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              loading={loading}
              onAdd={handleAddTransaction}
              onDelete={handleDeleteTransaction}
            />
          )}

          {activeView === 'accounts' && (
            <AccountView
              accounts={accounts}
              loading={loading}
              onAdd={handleAddAccount}
              onDelete={handleDeleteAccount}
            />
          )}

          {activeView === 'categories' && (
            <CategoryView
              categories={categories}
              loading={loading}
              onAdd={handleAddCategory}
              onDelete={handleDeleteCategory}
            />
          )}

          {activeView === 'transfers' && (
            <TransferView
              transfers={transfers}
              accounts={accounts}
              loading={loading}
              onAdd={handleAddTransfer}
              onDelete={handleDeleteTransfer}
            />
          )}

          {activeView === 'recurring' && (
            <RecurringView
              recurring={recurring}
              accounts={accounts}
              categories={categories}
              loading={loading}
              onAdd={handleAddRecurring}
              onDelete={handleDeleteRecurring}
            />
          )}

          {activeView === 'budgets' && (
            <BudgetView
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              loading={loading}
              onAdd={handleAddBudget}
              onDelete={handleDeleteBudget}
            />
          )}
        </div>
      </main>
    </div>
  );
}