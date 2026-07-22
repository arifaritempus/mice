import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";
import { SettingsService } from "@/lib/supabaseService";

// Admin yetkili Supabase istemcisini oluştur
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-posta adresi zorunludur" },
        { status: 400 }
      );
    }

    // 1. Şirket/Firma bilgilerini al
    let companyName = "Firma";
    let logoUrl = "";
    try {
      const settings = await SettingsService.getSettings();
      const generalSettings = settings?.general_settings;
      if (generalSettings) {
        companyName = generalSettings.companyName || generalSettings.company_name || process.env.NEXT_PUBLIC_AGENCY_NAME || "Firma";
        logoUrl = generalSettings.lightIconLogo || generalSettings.light_icon_logo || "";
      }
    } catch (e) {
      console.warn("Ayarlar çekilemedi, varsayılan değerler kullanılacak", e);
    }

    // Origin ve Host tespiti (Şifre sıfırlama linki için)
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const siteUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:6002");

    // 2. Supabase üzerinden (admin yetkisiyle) şifre sıfırlama linki üret (Mail GÖNDERMEZ, sadece linki döndürür)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${siteUrl}/reset-password`,
      }
    });

    if (linkError) {
      console.error("Link oluşturma hatası:", linkError);
      return NextResponse.json(
        { error: "Şifre sıfırlama linki oluşturulamadı. Kullanıcı bulunamamış olabilir." },
        { status: 400 }
      );
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { error: "Geçerli bir sıfırlama linki alınamadı." },
        { status: 500 }
      );
    }

    // Supabase linki yerine kendi domainimiz üzerinden bir link oluşturuyoruz.
    // actionLink örneği: https://xxx.supabase.co/auth/v1/verify?token=abc&type=recovery&redirect_to=...
    let finalLink = actionLink;
    try {
      const url = new URL(actionLink);
      const token = url.searchParams.get("token");
      if (token) {
        // Doğrudan kendi sitemize yönlendirip frontend'de verifyOtp ile token'ı doğrulayacağız
        finalLink = `${siteUrl}/reset-password?token_hash=${token}&type=recovery`;
      }
    } catch (e) {
      console.warn("Link parse edilemedi, orijinal link kullanılacak", e);
    }

    // 3. E-posta şablonunu hazırla
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-w-6xl mx-auto p-6 bg-gray-50 text-gray-800 rounded-xl border border-gray-200">
        <div style="text-align: center; margin-bottom: 30px;">
          ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-height: 80px;" />` : `<h1 style="color: #2563eb;">${companyName}</h1>`}
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="margin-top: 0; color: #1e293b;">Şifre Sıfırlama Talebi</h2>
          <p>Merhaba,</p>
          <p>Hesabınızın şifresini sıfırlamak için bir talepte bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${finalLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
          </div>
          <p style="font-size: 14px; color: #64748b;">Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <p style="font-size: 14px; color: #64748b; margin-top: 20px;">Saygılarımızla,<br/><strong>${companyName} Ekibi</strong></p>
        </div>
      </div>
    `;

    // 4. E-postayı özel SMTP (Nodemailer) üzerinden gönder
    await sendMail({
      to: email,
      subject: `${companyName} - Şifre Sıfırlama İşlemi`,
      html: htmlTemplate
    });

    return NextResponse.json({ success: true, message: "Şifre sıfırlama maili başarıyla gönderildi." });

  } catch (error: any) {
    console.error("Şifre sıfırlama endpoint hatası:", error);
    return NextResponse.json(
      { error: error.message || "Bilinmeyen bir hata oluştu" },
      { status: 500 }
    );
  }
}
