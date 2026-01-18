import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    // Fetch all data in parallel
    const [
      accountsRes,
      categoriesRes,
      transactionsRes,
      recurringRes,
      budgetsRes,
    ] = await Promise.all([
      supabase.from('accounts').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').order('date', { ascending: false }).limit(500),
      supabase.from('recurring_transactions').select('*').eq('is_active', true).order('next_run', { ascending: true }).limit(10),
      supabase.from('budgets').select('*').order('created_at', { ascending: false }),
    ]);

    if (accountsRes.error) throw accountsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;
    if (transactionsRes.error) throw transactionsRes.error;
    if (recurringRes.error) throw recurringRes.error;
    if (budgetsRes.error) throw budgetsRes.error;

    const accounts = accountsRes.data || [];
    const categories = categoriesRes.data || [];
    const transactions = transactionsRes.data || [];
    const recurring = recurringRes.data || [];
    const budgets = budgetsRes.data || [];

    // Calculate total balance from all active accounts
    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.initial_balance || 0), 0);

    // Get current month transactions
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const currentMonthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart && tDate <= monthEnd;
    });

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Get recent transactions (last 10)
    const recentTransactions = transactions.slice(0, 10).map(t => ({
      ...t,
      category: categories.find(c => c.id === t.category_id),
      account: accounts.find(a => a.id === t.account_id),
    }));

    // Calculate budget progress
    const budgetProgress = budgets.map(budget => {
      const category = categories.find(c => c.id === budget.category_id);
      
      // Calculate spent amount for this budget period
      const spent = currentMonthTransactions
        .filter(t => t.category_id === budget.category_id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const percentage = budget.monthly_limit > 0 
        ? Math.round((spent / Number(budget.monthly_limit)) * 100) 
        : 0;

      return {
        id: budget.id,
        category_name: category?.name || 'Unknown',
        category_icon: category?.icon || '💰',
        spent,
        limit: Number(budget.monthly_limit),
        percentage,
      };
    });

    // Get upcoming recurring transactions
    const upcomingRecurring = recurring.slice(0, 5).map(r => ({
      ...r,
      category: categories.find(c => c.id === r.category_id),
      account: accounts.find(a => a.id === r.account_id),
    }));

    // Calculate 6 months chart data
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    const chartData = months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);

      const monthTrans = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= start && tDate <= end;
      });

      const income = monthTrans
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const expense = monthTrans
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        month: format(month, 'MMM'),
        income: Math.round(income),
        expense: Math.round(expense),
      };
    });

    return NextResponse.json({
      summary: {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
      },
      accounts,
      recentTransactions,
      upcomingRecurring,
      budgetProgress,
      chartData,
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}