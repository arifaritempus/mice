import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  // Önce NEXT_PUBLIC_SUPABASE_URL'yi kontrol et, yoksa SUPABASE_URL'yi dene
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL) as string;
  // Service Role Key için hem SUPABASE_SERVICE_ROLE_KEY hem de backend'deki SUPABASE_SERVICE_ROLE_KEY'i kontrol et
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) as string;

  if (!supabaseUrl) {
    console.error(
      "❌ Supabase URL bulunamadı. NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_URL ayarlanmalı.",
    );
    throw new Error(
      "Supabase URL eksik. Lütfen NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_URL env değişkenini ayarlayın.",
    );
  }

  if (!serviceRoleKey) {
    console.error(
      "❌ Service Role Key bulunamadı. SUPABASE_SERVICE_ROLE_KEY ayarlanmalı.",
    );
    throw new Error(
      "Service Role Key eksik. Lütfen SUPABASE_SERVICE_ROLE_KEY env değişkenini ayarlayın.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Kullanıcı ID gerekli" },
        { status: 400 },
      );
    }

    const body = await _req.json();
    const { password } = body || {};
    if (!password || String(password).trim() === "") {
      return NextResponse.json(
        { error: "Yeni şifre gerekli" },
        { status: 400 },
      );
    }

    const admin = getAdminClient();
    const { error } = await admin.auth.admin.updateUserById(id, {
      password: String(password),
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Beklenmeyen bir hata oluştu" },
      { status: 500 },
    );
  }
}
