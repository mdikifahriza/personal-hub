import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const VALID_CADENCE = new Set(['daily', 'weekly', 'monthly', 'quarterly', 'custom']);

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isMissingRelationError(errorCode?: string, message?: string) {
  return (
    errorCode === '42P01' ||
    (message || '').toLowerCase().includes('does not exist')
  );
}

function isDateString(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  cadence: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type GoalProgressRow = GoalRow & {
  achieved_amount: number;
  remaining_amount: number;
  progress_percent: number;
};

type TxRow = {
  amount: number;
  date: string;
};

function calculateProgress(goals: GoalRow[], transactions: TxRow[]) {
  return goals.map((goal) => {
    const achieved = transactions.reduce((sum, tx) => {
      if (tx.date >= goal.start_date && tx.date <= goal.end_date) {
        return sum + Number(tx.amount || 0);
      }
      return sum;
    }, 0);

    const progressPercent =
      goal.target_amount > 0 ? Number(((achieved / goal.target_amount) * 100).toFixed(2)) : 0;

    return {
      ...goal,
      achieved_amount: Number(achieved.toFixed(2)),
      remaining_amount: Number(Math.max(goal.target_amount - achieved, 0).toFixed(2)),
      progress_percent: progressPercent,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const activeOnly = searchParams.get('active') === 'true';

    const { data: fromView, error: viewError } = await supabase
      .from('v_income_goal_progress')
      .select('*')
      .order('start_date', { ascending: false });

    if (!viewError) {
      const goalsFromView = (fromView || []) as GoalProgressRow[];
      const goals = activeOnly
        ? goalsFromView.filter((goal) => goal.is_active)
        : goalsFromView;

      return NextResponse.json({ goals });
    }

    if (!isMissingRelationError(viewError.code, viewError.message)) {
      throw viewError;
    }

    const { data: goals, error: goalsError } = await supabase
      .from('income_goals')
      .select('*')
      .order('start_date', { ascending: false });
    if (goalsError) throw goalsError;

    const filteredGoals = activeOnly
      ? (goals || []).filter((goal: GoalRow) => goal.is_active)
      : goals || [];

    if (filteredGoals.length === 0) {
      return NextResponse.json({ goals: [] });
    }

    const minStartDate = filteredGoals.reduce(
      (min, goal: GoalRow) => (goal.start_date < min ? goal.start_date : min),
      filteredGoals[0].start_date
    );
    const maxEndDate = filteredGoals.reduce(
      (max, goal: GoalRow) => (goal.end_date > max ? goal.end_date : max),
      filteredGoals[0].end_date
    );

    const { data: incomeTransactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount, date')
      .eq('type', 'income')
      .gte('date', minStartDate)
      .lte('date', maxEndDate);
    if (transactionsError) throw transactionsError;

    const goalProgress = calculateProgress(filteredGoals, (incomeTransactions || []) as TxRow[]);

    return NextResponse.json({ goals: goalProgress });
  } catch (error) {
    console.error('GOALS GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetAmount = toNullableNumber(body.target_amount);

    if (!body.title || !targetAmount || targetAmount <= 0) {
      return NextResponse.json(
        { error: 'title dan target_amount (> 0) wajib diisi' },
        { status: 400 }
      );
    }

    if (!isDateString(body.start_date) || !isDateString(body.end_date)) {
      return NextResponse.json(
        { error: 'start_date dan end_date wajib format YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (body.end_date < body.start_date) {
      return NextResponse.json({ error: 'end_date tidak boleh sebelum start_date' }, { status: 400 });
    }

    const cadence = VALID_CADENCE.has(body.cadence) ? body.cadence : 'custom';

    const { data, error } = await supabase
      .from('income_goals')
      .insert({
        title: body.title,
        description: body.description || null,
        target_amount: targetAmount,
        cadence,
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: body.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, goal: data });
  } catch (error) {
    console.error('GOALS POST Error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
    }

    const { data: existingGoal, error: existingGoalError } = await supabase
      .from('income_goals')
      .select('start_date, end_date')
      .eq('id', body.id)
      .single();
    if (existingGoalError || !existingGoal) {
      return NextResponse.json({ error: 'goal tidak ditemukan' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description || null;

    if (body.target_amount !== undefined) {
      const targetAmount = toNullableNumber(body.target_amount);
      if (!targetAmount || targetAmount <= 0) {
        return NextResponse.json({ error: 'target_amount harus > 0' }, { status: 400 });
      }
      updates.target_amount = targetAmount;
    }

    if (body.cadence !== undefined) {
      if (!VALID_CADENCE.has(body.cadence)) {
        return NextResponse.json({ error: 'cadence tidak valid' }, { status: 400 });
      }
      updates.cadence = body.cadence;
    }

    if (body.start_date !== undefined) {
      if (!isDateString(body.start_date)) {
        return NextResponse.json({ error: 'start_date harus YYYY-MM-DD' }, { status: 400 });
      }
      updates.start_date = body.start_date;
    }
    if (body.end_date !== undefined) {
      if (!isDateString(body.end_date)) {
        return NextResponse.json({ error: 'end_date harus YYYY-MM-DD' }, { status: 400 });
      }
      updates.end_date = body.end_date;
    }

    const effectiveStartDate = updates.start_date || existingGoal.start_date;
    const effectiveEndDate = updates.end_date || existingGoal.end_date;

    if (effectiveEndDate < effectiveStartDate) {
      return NextResponse.json({ error: 'end_date tidak boleh sebelum start_date' }, { status: 400 });
    }

    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

    const { data, error } = await supabase
      .from('income_goals')
      .update(updates)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, goal: data });
  } catch (error) {
    console.error('GOALS PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    const hardDelete = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 });
    }

    if (hardDelete) {
      const { error } = await supabase.from('income_goals').delete().eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('income_goals')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('GOALS DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
