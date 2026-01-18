import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List recurring transactions
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .order('next_run', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ recurring: data || [] });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring transactions' },
      { status: 500 }
    );
  }
}

// POST - Create recurring transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        account_id: body.account_id,
        category_id: body.category_id,
        type: body.type,
        amount: body.amount,
        frequency: body.frequency,
        next_run: body.next_run,
        description: body.description || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, recurring: data });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring transaction' },
      { status: 500 }
    );
  }
}

// DELETE - Delete recurring transaction
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring transaction' },
      { status: 500 }
    );
  }
}