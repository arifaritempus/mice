import { NextResponse } from "next/server";
import { getRequestMailHtml } from "@/lib/templates/requestMail";
import { SettingsService } from "@/lib/supabaseService";

export async function GET() {
  try {
    // Veritabanından gerçek ayarları çek
    const settings = await SettingsService.getSettings();
    const generalSettings = settings?.general_settings || {};
    
    // Gerçek e-posta tasarımını örnek (dummy) verilerle doldur
    const htmlContent = getRequestMailHtml({
      reference: "TMI260730005",
      hotel_name: "Örnek Test Oteli Resort & Spa",
      company_name: "DEMO TEKNOLOJİ A.Ş.",
      date_range: "15.10.2026 - 18.10.2026",
      nights: 3,
      room_pax: "SNG: 100, DBL: 50, TRP: 0",
      events_html: `
        <span class="event-badge">📅 Toplantı (16.10.2026)</span>
        <span class="event-badge">🍸 Welcome Cocktail (15.10.2026)</span>
        <span class="event-badge">🍽️ Gala Yemeği (17.10.2026)</span>
      `,
      notes: "Bu bir önizleme mailidir. Gala gecesi için deniz manzaralı salon talep edilmektedir.",
      reply_to_email: generalSettings?.mailReplyTo || generalSettings?.mailFromEmail || "info@test.com",
      system_company_name: generalSettings?.companyName || generalSettings?.company_name || "MICE SİSTEMİ",
      system_company_phone: generalSettings?.companyPhone || generalSettings?.company_phone || "+90 555 123 4567",
      system_company_email: generalSettings?.companyEmail || generalSettings?.company_email || "hello@test.com"
    });

    // HTML formatında tarayıcıya döndür
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
    
  } catch (error) {
    console.error("Preview mail hatası:", error);
    return new NextResponse("Önizleme yüklenirken hata oluştu.", { status: 500 });
  }
}
