'use server';

import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('login')
      .select('password')
      .single();

    if (error || !data) {
      return { success: false, error: 'Terjadi kesalahan' };
    }

    if (data.password !== password) {
      return { success: false, error: 'Password salah' };
    }

    // Set cookie jika password benar
    const cookieStore = await cookies();
    cookieStore.set('auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true };
  } catch {
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth');
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('auth');
  return authCookie?.value || null;
}