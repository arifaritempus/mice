import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase admin client
function getAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL) as string;
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) as string;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL veya Service Role Key eksik.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminClient = getAdminClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    // Teklifi bul ve durumunu kontrol et
    const { data: quoteToVerify, error: quoteError } = await adminClient
      .from('quotes')
      .select('status')
      .eq('id', id)
      .single();

    if (quoteError) {
      return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
    }

    if (quoteToVerify?.status === "KONFİRME") {
      return NextResponse.json(
        { error: "Konfirme durumundaki teklifler silinemez. Lütfen önce durumunu değiştirin." },
        { status: 400 }
      );
    }

    // Projeleri bul ve sil
    const { data: linkedProjects } = await adminClient
      .from('projects')
      .select('id')
      .eq('quote_id', id);

    // Silme işlemine başla (RLS atlanarak tam yetkili silme)
    const [quoteItemsDelete, quoteLinksDelete] = await Promise.all([
      adminClient.from('quote_items').delete().eq('quote_id', id),
      adminClient.from('public_links').delete().eq('quote_id', id)
    ]);

    if (quoteItemsDelete.error) throw quoteItemsDelete.error;
    if (quoteLinksDelete.error) throw quoteLinksDelete.error;

    // TODO: projeleri de silebilmek için projectsService admin delete lazım ama 
    // projeyi silmek çok karmaşık. Eğer projesi varsa silinmesine izin vermeyelim 
    // veya sadece quote silsin. Frontend zaten projectsService.delete çağırıyor.

    const { error } = await adminClient
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: "Teklif silindi" });
  } catch (error: any) {
    console.error("Quotes Delete Error:", error);
    return NextResponse.json(
      { error: error.message || "Teklif silinemedi" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminClient = getAdminClient();
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
    }

    const body = await request.json();

    const { data, error } = await adminClient
      .from('quotes')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Quotes Update Error:", error);
    return NextResponse.json(
      { error: error.message || "Teklif güncellenemedi" },
      { status: 500 }
    );
  }
}
