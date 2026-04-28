import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) as string;

  if (!supabaseUrl) {
    throw new Error('Supabase URL eksik. NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_URL ayarlanmalı.');
  }
  if (!serviceRoleKey) {
    throw new Error('Service Role Key eksik. SUPABASE_SERVICE_ROLE_KEY ayarlanmalı.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const role = String(body?.role || '').trim();
    if (!email || !role) {
      return NextResponse.json({ error: 'email ve role zorunludur' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1) public.users tablosundan kullanıcıyı email ile bul
    const { data: userRow, error: userErr } = await admin
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();
    if (userErr || !userRow) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı (public.users)' }, { status: 404 });
    }

    // 2) Auth metadata.role güncelle (id public.users'tan gelmezse email ile auth.users'tan bul)
    let authUserId = userRow.id as string;
    let metaErr: any = null;
    const doUpdate = async (uid: string) => {
      const { error } = await admin.auth.admin.updateUserById(uid, { user_metadata: { role } });
      return error;
    };
    metaErr = await doUpdate(authUserId);
    if (metaErr) {
      // Eğer auth'ta bulunamadıysa email ile auth.users sorgula
      const { data: authUser, error: findErr } = await admin
        .from('auth.users' as any)
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
      if (!findErr && authUser) {
        authUserId = authUser.id;
        metaErr = await doUpdate(authUserId);
        if (metaErr) {
          // Auth metadata güncellenemese bile profile rolünü güncellemeye devam et
          // sadece log amaçlı response içine bilgi ekleyelim
          console.warn('Auth metadata güncellenemedi:', metaErr?.message);
        }
      } else {
        // Auth'ta kullanıcı yoksa sadece profile rolünü güncelle
        console.warn('Auth kullanıcısı bulunamadı, sadece public.users rolü güncellenecek');
      }
    }

    // 3) public.users.role güncelle
    const { error: updErr } = await admin
      .from('users')
      .update({ role, updated_at: new Date().toISOString() } as any)
      .eq('id', userRow.id);
    if (updErr) {
      return NextResponse.json({ error: `Profil rolü güncellenemedi: ${updErr.message}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: authUserId, email, role }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Beklenmeyen bir hata' }, { status: 500 });
  }
}


