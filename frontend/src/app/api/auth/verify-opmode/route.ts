import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { password, currentEmail } = await req.json();

    if (!password || String(password).trim() === "") {
      return NextResponse.json({ error: "Lütfen şifrenizi girin." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: "Sistem yapılandırma hatası." }, { status: 500 });
    }

    const cleanPassword = String(password);

    // 1. Önce aktif oturumdaki kullanıcının e-postasıyla doğrulamayı dene
    if (currentEmail) {
      const client = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data, error } = await client.auth.signInWithPassword({
        email: String(currentEmail).trim().toLowerCase(),
        password: cleanPassword,
      });
      if (!error && data.user) {
        return NextResponse.json({ success: true, verifiedBy: "currentUser" });
      }
    }

    // 2. Eğer eşleşmediyse, Süper Admin (arif.ari@tempustravel.co) şifresi mi diye kontrol et
    // (Böylece yönetici herhangi bir personelin ekranında kendi şifresiyle de kilidi açabilir)
    const client = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: adminData, error: adminError } = await client.auth.signInWithPassword({
      email: "arif.ari@tempustravel.co",
      password: cleanPassword,
    });
    if (!adminError && adminData.user) {
      return NextResponse.json({ success: true, verifiedBy: "superAdmin" });
    }

    // 3. Eğer yine eşleşmediyse (örneğin yönetici kendi oturumundayken personelin şifresini test ediyorsa)
    // Sistemdeki diğer aktif kullanıcıların şifresi mi diye kontrol et
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { data: usersData } = await adminClient
        .from("users")
        .select("email")
        .eq("is_active", true);

      if (usersData && usersData.length > 0) {
        for (const u of usersData) {
          if (!u.email) continue;
          const userEmail = String(u.email).trim().toLowerCase();
          if (
            userEmail === "arif.ari@tempustravel.co" ||
            (currentEmail && userEmail === String(currentEmail).trim().toLowerCase())
          ) {
            continue; // Zaten denendi
          }

          const { data: matchData, error: matchError } = await client.auth.signInWithPassword({
            email: userEmail,
            password: cleanPassword,
          });

          if (!matchError && matchData.user) {
            return NextResponse.json({ success: true, verifiedBy: "matchedUser" });
          }
        }
      }
    }

    return NextResponse.json(
      { error: "Hatalı şifre! Lütfen geçerli bir kullanıcı şifresi girin." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("OpMode verify error:", err);
    return NextResponse.json(
      { error: err?.message || "Doğrulama sırasında bir hata oluştu." },
      { status: 500 }
    );
  }
}
