import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List tasks atau routines
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');

    // Get routines
    if (type === 'routines') {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ routines: data || [] });
    }

    // Get tasks (default)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Create task atau routine
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const body = await req.json();

    // Create routine
    if (type === 'routines') {
      const { data, error } = await supabase
        .from('routines')
        .insert({
          title: body.title,
          time_of_day: body.time_of_day,
          days_of_week: body.days_of_week,
          is_active: body.is_active ?? true,
        })
        .select();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Create task (default)
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: body.title,
        description: body.description,
        priority: body.priority || 'medium',
        status: 'pending',
        due_date: body.due_date,
      })
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

// PATCH - Update task atau routine
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Update routine
    if (type === 'routines') {
      const { data, error } = await supabase
        .from('routines')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Update task (default)
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE - Delete task atau routine
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Delete routine
    if (type === 'routines') {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Delete task (default)
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}