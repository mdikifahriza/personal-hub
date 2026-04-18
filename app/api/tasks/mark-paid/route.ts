import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isMissingFunctionError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('function') &&
    (lower.includes('does not exist') || lower.includes('could not find the function'))
  );
}

async function resolveIncomeCategoryId(preferredId?: string | null) {
  if (preferredId) return preferredId;

  const { data: taskPaymentCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('type', 'income')
    .ilike('name', 'task payment')
    .limit(1)
    .maybeSingle();

  if (taskPaymentCategory?.id) return taskPaymentCategory.id;

  const { data: firstIncomeCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('type', 'income')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return firstIncomeCategory?.id ?? null;
}

async function resolveActiveAccountId(preferredId?: string | null) {
  if (preferredId) return preferredId;

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return account?.id ?? null;
}

async function markTaskPaidFallback({
  taskId,
  paidAmount,
  paidDate,
  accountId,
  categoryId,
  description,
}: {
  taskId: string;
  paidAmount: number;
  paidDate: string;
  accountId?: string | null;
  categoryId?: string | null;
  description?: string | null;
}) {
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, title, completed_at')
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    throw new Error('Task tidak ditemukan');
  }

  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select('id')
    .eq('source_type', 'task_payment')
    .eq('source_id', taskId)
    .limit(1)
    .maybeSingle();

  if (existingTransaction?.id) {
    return existingTransaction.id;
  }

  const { data: finance } = await supabase
    .from('task_finance')
    .select('account_id, category_id')
    .eq('task_id', taskId)
    .maybeSingle();

  const resolvedAccountId = await resolveActiveAccountId(accountId || finance?.account_id || null);
  if (!resolvedAccountId) {
    throw new Error('Tidak ada akun aktif untuk mencatat pembayaran');
  }

  const resolvedCategoryId = await resolveIncomeCategoryId(
    categoryId || finance?.category_id || null
  );
  if (!resolvedCategoryId) {
    throw new Error('Tidak ada kategori income untuk pembayaran task');
  }

  const txDescription =
    description?.trim() || `Pembayaran task: ${task.title || 'Tanpa Judul'}`;

  const { data: createdTransaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      type: 'income',
      amount: paidAmount,
      category_id: resolvedCategoryId,
      account_id: resolvedAccountId,
      description: txDescription,
      date: paidDate,
      source_type: 'task_payment',
      source_id: taskId,
      is_auto_generated: true,
    })
    .select('id')
    .single();

  if (transactionError || !createdTransaction?.id) {
    throw new Error(transactionError?.message || 'Gagal membuat transaksi pembayaran task');
  }

  const nowIso = new Date().toISOString();
  const { error: financeError } = await supabase.from('task_finance').upsert(
    {
      task_id: taskId,
      paid_amount: paidAmount,
      paid_at: nowIso,
      payment_status: 'paid',
      invoice_status: 'paid',
      account_id: resolvedAccountId,
      category_id: resolvedCategoryId,
      transaction_id: createdTransaction.id,
      updated_at: nowIso,
    },
    { onConflict: 'task_id' }
  );

  if (financeError) {
    throw new Error(financeError.message);
  }

  const { error: taskUpdateError } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: task.completed_at || nowIso,
    })
    .eq('id', taskId);

  if (taskUpdateError) {
    throw new Error(taskUpdateError.message);
  }

  return createdTransaction.id;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const taskId = typeof body.task_id === 'string' ? body.task_id : '';

    if (!taskId) {
      return NextResponse.json({ error: 'task_id wajib diisi' }, { status: 400 });
    }

    const paidAmount = toNullableNumber(body.paid_amount);
    if (!paidAmount || paidAmount <= 0) {
      return NextResponse.json({ error: 'paid_amount harus lebih dari 0' }, { status: 400 });
    }

    const paidDate =
      typeof body.paid_date === 'string' && body.paid_date
        ? body.paid_date
        : new Date().toISOString().slice(0, 10);

    const accountId = typeof body.account_id === 'string' ? body.account_id : null;
    const categoryId = typeof body.category_id === 'string' ? body.category_id : null;
    const description = typeof body.description === 'string' ? body.description : null;

    const rpcPayload = {
      p_task_id: taskId,
      p_paid_amount: paidAmount,
      p_paid_date: paidDate,
      p_account_id: accountId,
      p_category_id: categoryId,
      p_description: description,
    };

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'mark_task_as_paid',
      rpcPayload
    );

    if (!rpcError && rpcData) {
      return NextResponse.json({
        success: true,
        transaction_id: rpcData,
        mode: 'rpc',
      });
    }

    if (rpcError && !isMissingFunctionError(rpcError.message)) {
      throw new Error(rpcError.message);
    }

    const transactionId = await markTaskPaidFallback({
      taskId,
      paidAmount,
      paidDate,
      accountId,
      categoryId,
      description,
    });

    return NextResponse.json({
      success: true,
      transaction_id: transactionId,
      mode: 'fallback',
    });
  } catch (error) {
    console.error('MARK PAID Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to mark task as paid' },
      { status: 500 }
    );
  }
}

