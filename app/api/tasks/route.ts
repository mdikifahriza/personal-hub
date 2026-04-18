import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const VALID_TASK_STATUSES = new Set(['pending', 'in_progress', 'completed']);
const VALID_PRIORITIES = new Set(['high', 'medium', 'low']);
const VALID_INVOICE_STATUSES = new Set([
  'not_sent',
  'sent',
  'partial',
  'paid',
  'overdue',
  'cancelled',
]);
const VALID_PAYMENT_STATUSES = new Set(['unpaid', 'partial', 'paid']);

type JsonObject = Record<string, unknown>;

type TaskRecord = JsonObject & {
  task_finance?: JsonObject | JsonObject[] | null;
  task_reminders?: JsonObject | JsonObject[] | null;
};

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeReminderAt(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T09:00:00+07:00`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeTask(task: TaskRecord) {
  const finance = Array.isArray(task.task_finance)
    ? task.task_finance[0] ?? null
    : task.task_finance ?? null;

  const reminders = Array.isArray(task.task_reminders)
    ? task.task_reminders
    : task.task_reminders
    ? [task.task_reminders]
    : [];

  const normalizedTask: JsonObject = {
    ...task,
    finance,
    reminders,
  };

  delete normalizedTask.task_finance;
  delete normalizedTask.task_reminders;

  return normalizedTask;
}

function buildFinancePayload(taskId: string, finance: unknown): JsonObject | null {
  if (!finance || typeof finance !== 'object') return null;
  const financeInput = finance as JsonObject;

  const payload: JsonObject = {
    task_id: taskId,
    updated_at: new Date().toISOString(),
  };

  if (financeInput.client_name !== undefined) {
    payload.client_name = financeInput.client_name || null;
  }
  if (financeInput.invoice_number !== undefined) {
    payload.invoice_number = financeInput.invoice_number || null;
  }

  if (financeInput.expected_amount !== undefined) {
    payload.expected_amount = toNullableNumber(financeInput.expected_amount);
  }
  if (financeInput.agreed_amount !== undefined) {
    payload.agreed_amount = toNullableNumber(financeInput.agreed_amount);
  }
  if (financeInput.paid_amount !== undefined) {
    payload.paid_amount = toNullableNumber(financeInput.paid_amount) ?? 0;
  }

  const invoiceStatus = asString(financeInput.invoice_status);
  if (invoiceStatus && VALID_INVOICE_STATUSES.has(invoiceStatus)) {
    payload.invoice_status = invoiceStatus;
  }

  const paymentStatus = asString(financeInput.payment_status);
  if (paymentStatus && VALID_PAYMENT_STATUSES.has(paymentStatus)) {
    payload.payment_status = paymentStatus;
  }

  if (financeInput.paid_at !== undefined) {
    payload.paid_at = financeInput.paid_at || null;
  }
  if (financeInput.account_id !== undefined) {
    payload.account_id = financeInput.account_id || null;
  }
  if (financeInput.category_id !== undefined) {
    payload.category_id = financeInput.category_id || null;
  }
  if (financeInput.auto_create_transaction !== undefined) {
    payload.auto_create_transaction = Boolean(financeInput.auto_create_transaction);
  }

  const meaningfulKeys = Object.keys(payload).filter(
    (key) => key !== 'task_id' && key !== 'updated_at'
  );

  return meaningfulKeys.length > 0 ? payload : null;
}

async function fetchSingleTask(id: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, task_finance(*), task_reminders(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return normalizeTask(data as TaskRecord);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');

    if (type === 'routines') {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ routines: data || [] });
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*, task_finance(*), task_reminders(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tasks = ((data || []) as TaskRecord[]).map(normalizeTask);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const body = (await req.json()) as JsonObject;

    if (type === 'routines') {
      const { data, error } = await supabase
        .from('routines')
        .insert({
          title: asString(body.title),
          time_of_day: asString(body.time_of_day),
          days_of_week: Array.isArray(body.days_of_week) ? body.days_of_week : [],
          is_active: body.is_active ?? true,
        })
        .select();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const title = asString(body.title);
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'title wajib diisi' }, { status: 400 });
    }

    const priorityRaw = asString(body.priority);
    const priority =
      priorityRaw && VALID_PRIORITIES.has(priorityRaw) ? priorityRaw : 'medium';

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description: asString(body.description) || null,
        priority,
        status: 'pending',
        due_date: asString(body.due_date) || null,
      })
      .select()
      .single();

    if (error) throw error;

    const financePayload = buildFinancePayload(task.id as string, body.finance);
    if (financePayload) {
      const { error: financeError } = await supabase
        .from('task_finance')
        .upsert(financePayload, { onConflict: 'task_id' });
      if (financeError) throw financeError;
    }

    const reminderAt = normalizeReminderAt(body.reminder_at);
    if (reminderAt) {
      const reminderType = asString(body.reminder_type) || 'due_date';
      const { error: reminderError } = await supabase.from('task_reminders').insert({
        task_id: task.id,
        reminder_type: reminderType,
        remind_at: reminderAt,
        note: asString(body.reminder_note) || null,
        is_done: false,
      });
      if (reminderError) throw reminderError;
    }

    const freshTask = await fetchSingleTask(task.id as string);
    return NextResponse.json({ task: freshTask });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const body = (await req.json()) as JsonObject;
    const id = asString(body.id);

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (type === 'routines') {
      const updates: JsonObject = { ...body };
      delete updates.id;

      const { data, error } = await supabase
        .from('routines')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const updates: JsonObject = { ...body };
    delete updates.id;

    const finance = updates.finance;
    const reminderAtRaw = updates.reminder_at;
    const reminderTypeRaw = updates.reminder_type;
    const reminderNoteRaw = updates.reminder_note;

    delete updates.finance;
    delete updates.reminder_at;
    delete updates.reminder_type;
    delete updates.reminder_note;

    const taskUpdates: JsonObject = {};

    const title = asString(updates.title);
    if (title !== null) taskUpdates.title = title;

    if (updates.description !== undefined) {
      taskUpdates.description = asString(updates.description) || null;
    }

    const priority = asString(updates.priority);
    if (priority && VALID_PRIORITIES.has(priority)) {
      taskUpdates.priority = priority;
    }

    const status = asString(updates.status);
    if (status && VALID_TASK_STATUSES.has(status)) {
      taskUpdates.status = status;
    }

    if (updates.due_date !== undefined) {
      taskUpdates.due_date = asString(updates.due_date) || null;
    }

    if (updates.completed_at !== undefined) {
      taskUpdates.completed_at = asString(updates.completed_at) || null;
    }

    if (Object.keys(taskUpdates).length > 0) {
      const { error: taskUpdateError } = await supabase
        .from('tasks')
        .update(taskUpdates)
        .eq('id', id);
      if (taskUpdateError) throw taskUpdateError;
    }

    const financePayload = buildFinancePayload(id, finance);
    if (financePayload) {
      const { error: financeError } = await supabase
        .from('task_finance')
        .upsert(financePayload, { onConflict: 'task_id' });
      if (financeError) throw financeError;
    }

    if (reminderAtRaw !== undefined) {
      const { error: deleteReminderError } = await supabase
        .from('task_reminders')
        .delete()
        .eq('task_id', id)
        .eq('reminder_type', 'due_date')
        .eq('is_done', false);
      if (deleteReminderError) throw deleteReminderError;

      const reminderAt = normalizeReminderAt(reminderAtRaw);
      if (reminderAt) {
        const reminderType = asString(reminderTypeRaw) || 'due_date';
        const reminderNote = asString(reminderNoteRaw) || null;

        const { error: insertReminderError } = await supabase.from('task_reminders').insert({
          task_id: id,
          reminder_type: reminderType,
          remind_at: reminderAt,
          note: reminderNote,
          is_done: false,
        });
        if (insertReminderError) throw insertReminderError;
      }
    }

    const updatedTask = await fetchSingleTask(id);
    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    if (type === 'routines') {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

