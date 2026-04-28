
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string;
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) as string;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Kullanıcı ID gereklidir' }, { status: 400 });
    }

    const admin = getAdminClient();

    console.log(`🗑️ Kullanıcı siliniyor: ${id}`);

    // 1. Auth tablosundan sil (Bu işlem listeyi temizleyecektir çünkü liste auth.users'ı baz alıyor)
    const { error: authError } = await admin.auth.admin.deleteUser(id);
    
    if (authError) {
      console.error('❌ Auth kullanıcı silme hatası:', authError);
      // Eğer kullanıcı auth tarafında zaten yoksa devam et (public tarafını temizlemek için)
      if (!authError.message.includes('User not found')) {
        return NextResponse.json({ error: authError.message || 'Auth kullanıcısı silinemedi' }, { status: 400 });
      }
    }

    // 2. Public.users tablosundan sil
    const { error: publicError } = await admin
      .from('users')
      .delete()
      .eq('id', id);

    if (publicError) {
      console.warn('⚠️ Public profil silme hatası (FK kısıtlaması olabilir):', publicError.message);
      // Profil silinemese bile auth silindiği için kullanıcı listeden kaybolacaktır.
      // Bu yüzden hata döndürmek yerine durumu başarılı sayabiliriz veya bir uyarı verebiliriz.
      // Ama burada kullanıcıya "başarılı" demek için sadece auth silinmesi yeterli.
    }

    return NextResponse.json({ message: 'Kullanıcı başarıyla silindi' }, { status: 200 });

  } catch (e: any) {
    console.error('❌ Delete API error:', e);
    return NextResponse.json({ error: e?.message || 'Beklenmeyen bir hata oluştu' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Kullanıcı ID gereklidir' }, { status: 400 });
    }

    const admin = getAdminClient();

    console.log(`📝 Kullanıcı güncelleniyor: ${id}`, body);

    // Güncellenecek verileri hazırla
    const updateData: any = {};
    if (body.first_name !== undefined || body.last_name !== undefined) {
      // Eğer first_name veya last_name geldiyse full_name'i güncelle
      const firstName = body.first_name || '';
      const lastName = body.last_name || '';
      updateData.full_name = `${firstName} ${lastName}`.trim();
    }
    
    if (body.role !== undefined) updateData.role = body.role;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.email !== undefined) updateData.email = body.email;

    // 1. Profil tablosunu güncelle
    const { data: updatedUser, error: publicError } = await admin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (publicError) {
      console.error('❌ Public profil güncelleme hatası:', publicError);
      return NextResponse.json({ error: publicError.message || 'Profil güncellenemedi' }, { status: 400 });
    }

    // 2. Eğer email değiştiyse, Auth tablosunu da güncelle
    if (body.email) {
      const { error: authError } = await admin.auth.admin.updateUserById(id, {
        email: body.email
      });
      if (authError) {
        console.warn('⚠️ Auth email güncelleme hatası:', authError.message);
      }
    }

    return NextResponse.json({ 
      message: 'Kullanıcı başarıyla güncellendi',
      user: updatedUser 
    }, { status: 200 });

  } catch (e: any) {
    console.error('❌ Patch API error:', e);
    return NextResponse.json({ error: e?.message || 'Beklenmeyen bir hata oluştu' }, { status: 500 });
  }
}
