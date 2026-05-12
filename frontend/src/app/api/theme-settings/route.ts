import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const key = serviceKey || anonKey;

    if (!url || !key) {
      return NextResponse.json({ general_settings: null }, { status: 200 });
    }

    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await client
      .from('settings')
      .select('value')
      .eq('key', 'general_settings')
      .maybeSingle();

    if (error) {
      console.error('[ThemeSettingsAPI] Supabase error:', error);
      return NextResponse.json({ general_settings: null }, { status: 200 });
    }

    let parsed: any = data?.value ?? null;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = null;
      }
    }

    return NextResponse.json({ general_settings: parsed || null }, { status: 200 });
  } catch (err) {
    console.error('[ThemeSettingsAPI] Global error:', err);
    return NextResponse.json({ general_settings: null }, { status: 200 });
  }
}
