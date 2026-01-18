'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SummaryCard from '@/components/finance/SummaryCard';
import AccountList from '@/components/finance/AccountList';
import RecentTransactions from '@/components/finance/RecentTransactions';
import UpcomingRecurring from '@/components/finance/UpcomingRecurring';
import BudgetProgress from '@/components/finance/BudgetProgress';
import IncomeExpenseChart from '@/components/finance/IncomeExpenseChart';

interface DashboardData {
  summary: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
  };
  accounts: any[];
  recentTransactions: any[];
  upcomingRecurring: any[];
  budgetProgress: any[];
  chartData: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12 text-gray-500">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12 text-gray-500">Failed to load dashboard</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Ringkasan keuangan Anda bulan ini
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Saldo"
              amount={data.summary.totalBalance}
              type="balance"
            />
            <SummaryCard
              title="Pemasukan Bulan Ini"
              amount={data.summary.monthlyIncome}
              type="income"
            />
            <SummaryCard
              title="Pengeluaran Bulan Ini"
              amount={data.summary.monthlyExpense}
              type="expense"
            />
          </div>

          {/* Chart & Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IncomeExpenseChart data={data.chartData} />
            </div>
            <div>
              <AccountList accounts={data.accounts} />
            </div>
          </div>

          {/* Recent Transactions & Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentTransactions transactions={data.recentTransactions} />
            <UpcomingRecurring recurring={data.upcomingRecurring} />
          </div>

          {/* Budget Progress */}
          {data.budgetProgress.length > 0 && (
            <BudgetProgress budgets={data.budgetProgress} />
          )}
        </div>
      </main>
    </div>
  );
}