import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client
function getAdminClient() {
  // Önce NEXT_PUBLIC_SUPABASE_URL'yi kontrol et, yoksa SUPABASE_URL'yi dene
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
  // Service Role Key için hem SUPABASE_SERVICE_ROLE_KEY hem de backend'deki SUPABASE_SERVICE_ROLE_KEY'i kontrol et
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) as string;

  if (!supabaseUrl) {
    console.error('❌ Supabase URL bulunamadı. NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_URL ayarlanmalı.');
    throw new Error('Supabase URL eksik. Lütfen NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_URL env değişkenini ayarlayın.');
  }

  if (!serviceRoleKey) {
    console.error('❌ Service Role Key bulunamadı. SUPABASE_SERVICE_ROLE_KEY ayarlanmalı.');
    throw new Error('Service Role Key eksik. Lütfen SUPABASE_SERVICE_ROLE_KEY env değişkenini ayarlayın.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export async function GET() {
  try {
    const admin = getAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (authError) {
      console.error('❌ Auth kullanıcıları listelenemedi:', authError);
      return NextResponse.json({ error: authError.message || 'Auth kullanıcıları alınamadı' }, { status: 400 });
    }

    const { data: profileRows, error: profileError } = await admin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.error('❌ Profil tablosu okunamadı:', profileError);
    }

    const profileById = new Map<string, any>((profileRows || []).map((row: any) => [row.id, row]));
    const users = (authData?.users || [])
      .map((authUser: any) => {
        const profile = profileById.get(authUser.id);
        let firstName = authUser.user_metadata?.first_name || '';
        let lastName = authUser.user_metadata?.last_name || '';
        let fullName = profile?.full_name || authUser.user_metadata?.full_name || '';

        // Eğer profil varsa ve full_name doluysa isimleri ondan çekmeyi dene
        if (profile?.full_name) {
          const parts = profile.full_name.trim().split(' ');
          if (parts.length > 1) {
            lastName = parts.pop();
            firstName = parts.join(' ');
          } else {
            firstName = parts[0];
          }
        }
        
        if (!fullName) {
          fullName = `${firstName} ${lastName}`.trim();
        }

        return {
          id: authUser.id,
          email: authUser.email || profile?.email || '',
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          role: profile?.role || authUser.user_metadata?.role || 'user',
          is_active: profile?.is_active ?? !authUser.banned_until,
          created_at: authUser.created_at || profile?.created_at || null,
          updated_at: profile?.updated_at || authUser.updated_at || null
        };
      })
      .sort((a: any, b: any) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      });

    return NextResponse.json(users, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Beklenmeyen bir hata oluştu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('📥 API /admin/users POST - Request body:', { 
      email: body?.email ? 'var' : 'yok',
      password: body?.password ? 'var' : 'yok',
      first_name: body?.first_name ? 'var' : 'yok',
      last_name: body?.last_name ? 'var' : 'yok',
      role: body?.role || 'user'
    });
    
    const { email, password, first_name, last_name, role = 'user' } = body || {};

    if (!email || !password || !first_name || !last_name) {
      console.error('❌ Zorunlu alanlar eksik:', { email: !!email, password: !!password, first_name: !!first_name, last_name: !!last_name });
      return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1) Auth'ta kullanıcı oluştur
    console.log('🔵 Auth kullanıcısı oluşturuluyor...');
    let userId = '';
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password: String(password),
      email_confirm: true,
      user_metadata: { first_name, last_name, role }
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log('ℹ️ Kullanıcı zaten Auth tarafında kayıtlı, profil kontrol ediliyor...');
        // Kullanıcıyı emailden bulalım
        const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === String(email).trim().toLowerCase());
        if (existingUser) {
          userId = existingUser.id;
        } else {
          return NextResponse.json({ error: 'Kullanıcı kayıtlı görünüyor ama ID bulunamadı' }, { status: 400 });
        }
      } else {
        console.error('❌ Auth kullanıcı oluşturma hatası:', authError);
        return NextResponse.json({ error: authError.message || 'Kullanıcı oluşturulamadı' }, { status: 400 });
      }
    } else {
      userId = authData.user?.id || '';
      console.log('✅ Auth kullanıcısı oluşturuldu:', userId);
    }

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı ID alınamadı' }, { status: 500 });
    }

    // 2) public.users tablosunda profil oluştur (upsert kullanarak varsa günceller)
    console.log('🔵 Profil oluşturuluyor...');
    const { error: insertErr } = await admin
      .from('users')
      .upsert({
        id: userId,
        email: String(email).trim().toLowerCase(),
        full_name: `${first_name} ${last_name}`.trim(),
        password_hash: 'SUPABASE_AUTH_MANAGED', // Veritabanındaki NOT NULL kısıtlamasını aşmak için
        role,
        is_active: true,
        updated_at: new Date().toISOString()
      } as any);

    if (insertErr) {
      console.error('❌ Profil oluşturma hatası:', insertErr);
      return NextResponse.json({ error: insertErr.message || 'Profil oluşturulamadı' }, { status: 400 });
    }
    console.log('✅ Profil oluşturuldu/güncellendi');

    return NextResponse.json({ user: { id: userId } }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Beklenmeyen bir hata oluştu' }, { status: 500 });
  }
}


